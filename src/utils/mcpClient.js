// utils/mcpClient.js
// this is used for a stateless MCP
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { fetchAccessToken } from "./oauth.js"
import { logger } from "./logger.js"

const mcpServerUrl = process.env.MCP_SERVER_URL || "http://localhost:9595/mcp"

let mcpClient = null
// let reconnectTimeout = null
let isConnecting = false
let mcpToken = ""

// I don't know at this point.
// Ref: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/client/sse.ts
// eventSourceInit.fetch() gives us control over how EventSource (used for SSE) is created
// and what request headers get sent...at least according to ChatGPT haha.
// TL;DR, from what I'm picking up, is that we're overriding the fetch to inject our headers
// not a huge fan of that.
async function connectMCP() {
  logger.info("Attempting to connect to MCP server")

  if (isConnecting) {
    logger.debug("MCP connection already in progress")
    return
  }

  isConnecting = true

  let tokenData = await fetchAccessToken()
  if (!tokenData) {
    logger.warn("No access token retrieved — MCP will not connect")
    isConnecting = false
    return
  }

  mcpToken = tokenData.token
  logger.debug(
    `Token expires at ${new Date(tokenData.expiresAt * 1000).toISOString()}`
  )

  const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl), {
    requestInit: {
      headers: {
        authorization: `Bearer ${mcpToken}`,
      },
    },
  })

  if (mcpClient) {
    try {
      await mcpClient.close()
      logger.info("Closed previous MCP connection")
    } catch (err) {
      logger.warn("Error closing previous MCP connection:", err)
    }
  }

  // Reinitialize
  const newClient = new McpClient(
    { name: "morgana", version: "4.0" },
    { capabilities: {} }
  )

  try {
    await newClient.connect(transport)
    logger.info("MCP connected!")
    const tools = await newClient.listTools()
    logger.debug("Available tools:", tools)
    mcpClient = newClient
  } catch (err) {
    logger.error("Failed to connect to MCP:", err)
  }

  isConnecting = false
}

function getMCPClient() {
  if (!mcpClient) {
    logger.warn("MCP Client not ready or not yet initialized")
  }
  return mcpClient
}

async function closeMCP() {
  logger.info("Closing connection")
  if (mcpClient) {
    try {
      await mcpClient.close()
      logger.info("Closed previous MCP connection")
    } catch (err) {
      logger.warn("Error closing previous MCP connection:", err)
    }
  }
}

export { connectMCP, getMCPClient, closeMCP }
