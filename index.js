import OpenAI from "openai";
import readlineSync from "readline-sync";
import "dotenv/config";
// require("dotenv").config()
// import { configDotenv } from "dotenv";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

function getWeather(city = "") {
  if (city.toLowerCase() === "Delhi") return "10°";
  if (city.toLowerCase() === "Mumbai") return "15°";
  if (city.toLowerCase() === "UP") return "20°";
}

const tools = { getWeather: getWeather };

const userPrompt = "Hey, what is the weather of Mumbai?";

const systemPrompt = `You are an AI Assitant with START, PLAN, ACTION, Observation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with apappropriate tools and wait for Observation based on Action.
Once you get the observation, Return the AI response based on START prompt and Observations

Available Tools:
- function getWeather(city: string): string
getWeather is a function that accepts city name as string and returns the weather details

Example:
START
{"type": "user", "user": What is the sum of weather of Delhi and Mumbai Weather}
{"type": "plan", "plan": "I Will call the getWeather for Mumbai"}
{"type": "action", "function": "getWeather", "input" : "mumbai"}
{"type": "observation", "observation": "10°"}
{"type": "plan", "plan": "I will call getWeather for Mumbai"}
{"type": "action", "function": "getWeather", "input" : "delhi"}
{"type": "observation", "observation": "15°"}

`;

// async function chatAI() {
//   const result = await client.chat.completions.create({
//     // model: "gpt-4o",
//     model: "deepseek/deepseek-r1:free",
//     messages: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: userPrompt },
//       {
//         role: "developer",
//         content: `{"type": "plan", "plan": "I Will call the getWeather for Mumbai"}`,
//       },
//     ],
//   }).then((e) => {
//     // console.log(e.choices[0].message.content);
//     console.log(e);
//   });
//   console.log(result);
// }
// chatAI();

const messages = [{ role: "system", content: systemPrompt }];

while (true) {
  const query = readlineSync.question(">>");
  const q = {
    type: "user",
    user: query,
  };
  messages.push({ role: "user", content: JSON.stringify(q) });

  while (true) {
    const chat = await client.chat.completions.create({
      // model: "gpt-4o",
      model: "deepseek/deepseek-r1:free",
      // model: "deepseek-chat",
      messages: messages,
      response_format: { type: "json_object" },
    });
    const result = chat.choices[0].message.content;
    messages.push({ role: "assistant", content: result });

    const call = JSON.parse(result);
    if (call.type === "output") {
      console.log(`Bot: ${call.output}`);
      break;
    } else if (call.type === "action") {
      const fn = tools[call.function];
      const observation = fn(call.input);
      const obs = { type: "observation", observation: observation };
      messages.push({ role: "developer", content: JSON.stringify(obs) });
    }
  }
}
