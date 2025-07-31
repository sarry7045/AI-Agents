import { OpenAI } from "openai";
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OPENAI_API_KEY =
  "";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

function getWeatherInfo(cityName) {
  return `${cityName} has 43 Degree C`;
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, function (err, stdout, stderr) {
      if (err) {
        return reject(err);
      }
      resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
    });
  });
}

function createFile({ filePath, content = "" }) {
  if (typeof filePath !== "string") throw new Error("Invalid filePath");
  const fullPath = path.normalize(filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  return `File ${filePath} created successfully.`;
}

const TOOOLs_MAP = {
  executeCommand: executeCommand,
  getWeatherInfo: getWeatherInfo,
  createFile: createFile,
};

const SYSTEM_PROMPT = `
You are a helpful AI Assistant designed to resolve user queries. 

You work in the following phased manner:
1. **START**: The user provides a query.
2. **THINK**: Reflect on how to resolve the query in at least 3-4 steps to ensure clarity.
3. **ACTION**: If needed, call an appropriate tool with the necessary input parameters.
4. **OBSERVE**: Wait for the tool's output and review it.
5. **OUTPUT**: Based on the observed result, either provide the final output to the user or repeat the loop.

### Rules:
- Always wait for the next step before proceeding.
- Each step's output must be formatted strictly in JSON.
- Only call actions from the list of Available Tools.
- Follow the output format strictly in JSON.

### Available Tools:
1. **getWeatherInfo(city: string)**: Returns the weather information for the specified city.
2. **executeCommand(command: string)**: Executes a given Linux command on the user's device and returns STDOUT and STDERR.
3. **createFile({ filePath: string, content?: string })**: Creates a file at the specified path with optional content.

### Example:

#### User Input:
{ "role": "user", "content": "What is the weather of Mumbai?" }

#### Assistant's Steps:
1. THINK: 
{ "step": "think", "content": "The user is asking for the weather of Mumbai." }
2. THINK: 
{ "step": "think", "content": "From the available tools, I must call the getWeatherInfo tool with Mumbai as the input." }
3. ACTION:
{ "step": "action", "tool": "getWeatherInfo", "input": "Mumbai" }
4. OBSERVE (Sample Response from the Tool):
{ "step": "observe", "content": "32 Degree C" }
5. THINK:
{ "step": "think", "content": "The output of getWeatherInfo for Mumbai is 32 Degree C." }
6. OUTPUT:
{ "step": "output", "content": "Hey, The weather of Mumbai is 32 Degree C, which is quite hot🔥." }

### Output Format:
Each step must be formatted as a JSON object including "step," "tool" (if applicable), "input" (if applicable), and "content" (where relevant).

Example formats for different steps:
1. THINK Step:
{ "step": "think", "content": "The user is asking for the weather of Mumbai." }
2. ACTION Step:
{ "step": "action", "tool": "createFile", "input": { "filePath": "todo-app/index.html", "content": "..." } }`;

async function init() {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  // const userQuery = "Create a folder weather-app and create a weather app with HTML CSS and JS fully working with third party api";
  const userQuery = "Create a folder todo-app and create a todo app with HTML CSS and JS fully working";
  // const userQuery = "What is the Weather of Mumbai ?";
  // const userQuery = "Tell me about India ?";
  messages.push({ role: "user", content: userQuery });

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: messages,
    });

    messages.push({
      role: "assistant",
      content: response.choices[0].message.content,
    });

    const parsed_response = JSON.parse(response.choices[0].message.content);
    if (parsed_response.step && parsed_response.step === "think") {
      console.log("Thinking: ", parsed_response.content);
      continue;
    }
    if (parsed_response.step && parsed_response.step === "output") {
      console.log("Final Response:", parsed_response.content);
      break;
    }
    if (parsed_response.step && parsed_response.step === "action") {
      const tool = parsed_response.tool;
      const input = parsed_response.input;

      if (typeof input === "string" && tool === "createFile") {
        const splitIndex = input.indexOf(",");
        const filePath = input.slice(0, splitIndex).trim();
        const content = input.slice(splitIndex + 1).trim();
        input = { filePath, content };
      }
      console.log(`${tool}, ${input}`);
      const value = await TOOOLs_MAP[tool](input);

      messages.push({
        role: "assistant",
        content: JSON.stringify({ step: "observe", content: value }),
      });
      continue;
    }
  }
}

init();

// You are an helpfull AI Assistant who is designed to resolve user query.
// You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.

// In the start phase, user gives a query to you.
// Then, you THINK how to resolve that query atleast 3-4 times and make sure that all is clear.
// If there is a need to call a tool, you call an ACTION event with tool and input parameters.
// If there is an action call, wait for the OBSERVE that is output of the tool.
// Based on the OBSERVE from prev step, you either output or repeat the loop.

// Rules:
// - Always wait for next step.
// - Always output a single step and wait for the next step.
// - Output must be strictly JSON
// – Only call tool action from Available Tools only.
// - Strictly follow the output format in JSON

// Available Tools:
// - getWeatherInfo(city: string): string
// - executeCommand(command): string Executes a given linux command on user's device and returns the STDOUT and STDERR.
// - createFile({ filePath: string, content?: string }): string

// Example:
// START: What is weather of Mumbai?
// THINK: The user is asking for the weather of Mumbai.
// THINK: From the available tools, I must call getWeatherInfo tool for Mumbai as input.
// ACTION: Call Tool getWeatherInfo(Mumbai)
// OBSERVE: 32 Degree C
// THINK: The output of getWeatherInfo for Mumbai is 32 Degree C
// OUTPUT: Hey, The weather of Mumbai is 32 Degree C which is quit hot🔥

// Output Example:
// { "role": "user", "content": "What is weather of Mumbai?" }
// { "step": "think": "content": "The user is asking for the weather of Mumbai." }
// { "step": "think": "content": "From the available tools, I must call getWeatherInfo tool for Mumbai as input"}
// { "step": "action": "tool": "getWeatherInfo", "input": "Mumbai" }
// { "step": "observe": "content": "32 Degree C" }
// { "step": "think": "content": "The output of getWeatherInfo for Mumbai is 32 Degree C"}
// { "step": "output": "content": "Hey, The weather of Mumbai is 32 Degree C which is quit hot🔥"}

// Output Format:
// { "step": "string", "tool": "string", "input": "string", "content": "string" }
// { "step": "action", "tool": "createFile", "input": { "filePath": "todo-app/index.html", "content": "<!DOCTYPE html>..." } }
