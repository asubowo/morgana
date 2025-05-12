// utils/mcpClient.js
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { EventSource } from "eventsource"
import { fetchAccessToken } from "./oauth.js"
import { logger } from "./logger.js"

const mcpServerUrl = process.env.MCP_SERVER_URL || "http://localhost:9595/sse"

let mcpClient = null
// let reconnectTimeout = null
let isConnecting = false
let mcpToken = ""

globalThis.EventSource = EventSource

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

  const transport = new SSEClientTransport(new URL(mcpServerUrl), {
    requestInit: {
      headers: {
        authorization: `Bearer ${mcpToken}`,
      },
    },
    eventSourceInit: {
      async fetch(input, init = {}) {
        const headers = new Headers(init.headers || {})
        headers.set("authorization", `Bearer ${mcpToken}`)
        return fetch(input, { ...init, headers })
      },
    },
  })

  try {
    await mcpClient.close()
    logger.info("Closed previous MCP connection")
  } catch (err) {
    logger.warn("No existing MCP connection to close (or error closing):", err)
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
    logger.warn("MCP tools will be unavailable until restart")
  }

  isConnecting = false
}

function getMCPClient() {
  if (!mcpClient) {
    logger.warn("MCP Client not ready or not yet initialized")
  }
  return mcpClient
}

function stopMCP() {
  isConnecting = false
  logger.info("Stopping MCP Client...")
  if (mcpClient) {
    return mcpClient.close()
  } else {
    logger.info("Client already stopped.")
  }
}

export { connectMCP, getMCPClient, stopMCP }
