import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { config } from "dotenv";
import { ToolMessage } from "@langchain/core/messages";

config();

const LLM = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o",
});

// Define tools
const multiply = tool(
  async ({ a, b }) => {
    return `${a * b}`;
  },
  {
    name: "multiply",
    description: "Multiply two numbers together",
    schema: z.object({
      a: z.number().describe("first number"),
      b: z.number().describe("second number"),
    }),
  }
);

const add = tool(
  async ({ a, b }) => {
    return `${a + b}`;
  },
  {
    name: "add",
    description: "Add two numbers together",
    schema: z.object({
      a: z.number().describe("first number"),
      b: z.number().describe("second number"),
    }),
  }
);

const divide = tool(
  async ({ a, b }) => {
    return `${a / b}`;
  },
  {
    name: "divide",
    description: "Divide two numbers",
    schema: z.object({
      a: z.number().describe("first number"),
      b: z.number().describe("second number"),
    }),
  }
);
// Tools Ends Here

// Augment the LLM with tools
const availableTools = [add, multiply, divide];
const toolsByName = Object.fromEntries(
  availableTools.map((tool) => [tool.name, tool])
);
const llmWithTools = LLM.bindTools(availableTools);
// Augment End Here

// Nodes
async function llmCall(state) {
  // LLM decides whether to call a tool or not
  const result = await llmWithTools.invoke([
    {
      role: "system",
      content:
        "You are a helpful assistant tasked with performing arithmetic on a set of inputs.",
    },
    ...state.messages,
  ]);

  return {
    messages: [result],
  };
}

async function toolNode(state) {
  const results = [];
  const lastMessage = state.messages.at(-1);

  if (lastMessage?.tool_calls?.length) {
    for (const toolCall of lastMessage.tool_calls) {
      const tool = toolsByName[toolCall.name];
      const observation = await tool.invoke(toolCall.args);
      results.push(
        new ToolMessage({
          content: observation,
          tool_call_id: toolCall.id,
        })
      );
    }
  }
  return { messages: results };
}

// Conditional edge function to route to the tool node or end
function shouldContinue(state) {
  const messages = state.messages;
  const lastMessage = messages.at(-1);

  // If the LLM makes a tool call, then perform an action
  if (lastMessage?.tool_calls?.length) {
    return "Action";
  }
  // Otherwise, we stop (reply to the user)
  return "__end__";
}

const agentBuilder = new StateGraph(MessagesAnnotation)
  .addNode("llmCall", llmCall)
  .addNode("tools", toolNode)
  .addEdge("__start__", "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, {
    // Name returned by shouldContinue : Name of next node to visit
    Action: "tools",
    __end__: "__end__",
  })
  .addEdge("tools", "llmCall")
  .compile();

const messages = [
  {
    role: "user",
    content: "Add 5 and 5 then multiple that by 10 and divide it by 2",
  },
];
const result = await agentBuilder.invoke({ messages });
console.log(result.messages);

// LangSmith
// https://smith.langchain.com/o/8a71d05a-06fd-41cc-888b-74e8c701b03b/projects/p/288d0b62-d697-483b-b18f-441495604beb?timeModel=%7B%22duration%22%3A%227d%22%7D&peek=e14d3008-65b2-45fb-abca-b32924959303&peeked_trace=e14d3008-65b2-45fb-abca-b32924959303
// Langchain Docs
// https://langchain-ai.github.io/langgraphjs/tutorials/workflows/#agent
