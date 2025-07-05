import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { turnOnBulb, turnOffBulb, changeColour } from "./service";
import { z } from "zod";

turnOnBulb();
changeColour({ r: 0, g: 100, b: 0, dimming: 50 });

const server = new McpServer({
  name: "Smart Bulb",
  version: "1.0.0",
  capabilities: {
    resoures: {},
    tools: {},
  },
});

server.tool("turn-on-bulb", "Turns the bulb on", async () => {
  await turnOnBulb();
  return { content: [{ type: "text", text: "Bulb has been turned on" }] };
});

server.tool("turn-on-bulb", "Turns the bulb OFF", async () => {
  await turnOffBulb();
  return { content: [{ type: "text", text: "Bulb has been turned Off" }] };
});

server.tool(
  "change-bulb-color",
  "Changes the color of the bulb",
  {
    r: z.number().describe("Red color of the light 0 - 255"),
    g: z.number().describe("Green color of the light 0 - 255"),
    b: z.number().describe("Blue color of the light 0 - 255"),
    dimming: z
      .number()
      .describe(
        "Dimming of light where 0 means no light, 100 means full and 50 means 50% brightess"
      ),
  },
  async ({ r, g, b, dimming }) => {
    await changeColour({ r, g, b, dimming });
    return { content: [{ type: "text", text: "Bulb has been turned Off" }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Weather MCP Server running on STDIO");
}

main();
