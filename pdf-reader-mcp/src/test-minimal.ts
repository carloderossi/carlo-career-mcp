#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Minimal test server
const server = new Server(
  {
    name: "carlo-career-test",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Just one simple tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "test",
        description: "A test tool",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

async function main() {
  console.error("Test server starting...");
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Test server connected and running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
