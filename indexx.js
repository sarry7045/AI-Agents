import express from "express";
import cors from "cors";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatMistralAI } from "@langchain/mistralai";
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const model = new ChatMistralAI({
  temperature: 0,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const deepThinkingPrompt = PromptTemplate.fromTemplate(`
    **Deep Thinking Analysis Task**
    Analyze the user's Query thoroughly. Consider:
    1) Primary Intent and underlying needs
    2. Potential ambiguities or missing context
    3. Required knowledge domains
    4. Response strategy

    User Query: {query}

    Step-by-Step Analysis:
    `);

const finalResponsePrompt = PromptTemplate.fromTemplate(`
    **Response Generation**
    Based on the analysis below, craft a comprehensive response.

    Analysis: {analysis}
    Original Query: {query}

    Response:
`);

const deepThinkingChain = deepThinkingPrompt
  .pipe(model)
  .pipe(new StringOutputParser());
const finalResponseChain = finalResponsePrompt
  .pipe(model)
  .pipe(new StringOutputParser());

app.post("/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-strem");
  res.setHeader("Content-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const query = req.body.query;
    let analysis = "";

    const deepThinkingOutput = await deepThinkingChain.stream({ query });

    for await (const chunk of deepThinkingOutput) {
      res.write(`event: deep-thinking\data: ${JSON.stringify({ chunk })}\n\n`);
    }

    const finalResponseOutPut = await finalResponseChain.stream({
      query,
      analysis,
    });

    for await (const chunk of finalResponseOutPut) {
      res.write(`event: deep-thinking\data: ${JSON.stringify({ chunk })}\n\n`);
    }
  } catch (error) {}
  a;
});

app.listen(3000, () => {
  console.log("Server is Running on 3000");
});
