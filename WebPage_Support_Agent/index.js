import axios from "axios";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import dotenv from "dotenv";
import { ChromaClient } from "chromadb";
// import { OpenAIEmbeddingFunction } from 'chromadb';

dotenv.config();

const openai = new OpenAI();
const chromaClient = new ChromaClient({ path: "https://localhost:8000" });
chromaClient.heartbeat();

const WEB_COLLECTION = `WEB_SCAPED_DATA_COLLECTION-1`;

async function scapeWebpage(url = "") {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const pageHead = $("head").html();
  const pageBody = $("body").html();
  const internalLinks = new Set();
  const externalLinks = new Set();

  $("a").each((_, el) => {
    const link = $(el).attr("href");
    if (link === "/") return;
    if (link.startsWith("http") || link.startsWith("https")) {
      externalLinks.add(link);
    } else {
      internalLinks.add(link);
    }
    console.log(link);
  });
  return {
    head: pageHead,
    body: pageBody,
    internalLinks: Array.from(internalLinks),
    externalLinks: Array.from(externalLinks),
  };
}

async function generateVectorEmbeddings({ text }) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  // return embedding.data[0].embedding;
  return embedding.data.map((item) => item.embedding);
}

async function insertIntoDB({ embedding, url, body = "", head }) {
  const collection = await chromaClient.getOrCreateCollection({
    name: WEB_COLLECTION,
  });
  await collection.add({
    ids: [url],
    embeddings: [embedding],
    metadatas: [{ url, body, head }],
  });
}

async function ingest(url = "") {
  console.log(`Ingesting ${url}`);
  const { head, body, internalLinks } = await scapeWebpage(url);
  const bodyChunks = chunkText(body, 1000);
  // const headEmbedding = await generateVectorEmbeddings({ text: head });
  // await insertIntoDB({ embedding: headEmbedding, url });
  for (const chunk of bodyChunks) {
    const bodyEmbedding = await generateVectorEmbeddings({ text: chunk });
    await insertIntoDB({ embedding: bodyEmbedding, url, head, body: chunk });
  }
  // for (const link of internalLinks) {
  //   const _url = `${url}${link}`;
  //   await ingest(_url);
  // }
  console.log(`Ingesting Success ${url}`);
}

// scapeWebpage("https://suraj.techboy.in/").then(console.log);
// ingest("https://suraj.techboy.in/");

async function chat(question = "") {
  const questionEmbedding = await generateVectorEmbeddings({ text: question });
  const collection = await chromaClient.getOrCreateCollection({
    name: WEB_COLLECTION,
  });
  const collectionResult = await collection.query({
    nResults: 1,
    queryEmbeddings: questionEmbedding,
  });

  const body = collectionResult.metadatas[0]
    .map((e) => e.body)
    .filter((e) => e.trim() !== "" && !!e);
  console.log("Body", body);

  const url = collectionResult.metadatas[0]
    .map((e) => e.url)
    .filter((e) => e.trim() !== "" && !!e);
  console.log("Body", body);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are AI support agent expert in providing support to users on behalf of a webpage. Given the context about page content, reply the user accordingly.",
      },
      {
        role: "user",
        content: `
          Query: ${question}\n\n
          URL: ${url.join(", ")}
          Retrived Context: ${body.join(", ")}`,
      },
    ],
  });
  console.log({
    message: `🤖 ${response.choices[0].message.content}`,
    url: url[0],
  });
}

chat("Total Experience of Suraj Yadav ?");

function chunkText(text, chunkSize, splitOnWhitespace = true) {
  if (chunkSize <= 0) {
    throw new Error("Chunk size must be greater than 0");
  }

  const chunks = [];
  let currentChunk = "";

  // Split text into words if we want to try to preserve word boundaries
  const segments = splitOnWhitespace ? text.split(/(\s+)/) : [text];

  for (const segment of segments) {
    // If adding the segment would exceed the chunk size
    if (currentChunk.length + segment.length > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      // If a single segment is larger than chunk size, split it
      if (segment.length > chunkSize) {
        const subSegments = segment.match(new RegExp(`.{1,${chunkSize}}`, "g"));
        for (let i = 0; i < subSegments.length; i++) {
          if (i === subSegments.length - 1 && splitOnWhitespace) {
            currentChunk = subSegments[i];
          } else {
            chunks.push(subSegments[i]);
          }
        }
      } else {
        currentChunk = segment;
      }
    } else {
      currentChunk += segment;
    }
  }
  // Add the last remaining chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  return chunks;
}
