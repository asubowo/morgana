/**
 * @author Andrew Subowo
 * @version 4.0
 */

import "./utils/env.js"
import fs from "fs"
import path from "path"
import { Client, GatewayIntentBits, Collection, ActivityType } from "discord.js"
import { OpenAI } from "openai"
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { EventSource } from "eventsource"
import { getStonks } from "./commands/utils/stocks.js"
import { sublinker } from "./commands/reddit/sublinker.js"
import { chatgpt } from "./commands/utils/openai.js"
import { fileURLToPath } from "url"
import { logger } from "./utils/logger.js"
import { fetchAccessToken } from "./utils/oauth.js"

const respondAnywhere = process.env.RESPOND_ANYWHERE || false
const mcpServerUrl = process.env.MCP_SERVER_URL || "http://localhost:9595/sse"
const openAIKey = process.env.CHATGPT_API_KEY

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"))

// Discord and OpenAI inits
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
})
const openAI = new OpenAI({
  apiKey: openAIKey,
})

client.commands = new Collection()
// command set
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = await import(`file://${filePath}`)
  client.commands.set(command.data.name, command)
}

// Create an instance of McpClient
let mcpClient = new McpClient(
  {
    name: "morgana",
    version: "4.0",
  },
  { capabilities: {} }
)
let mcpToken = ""
let reconnectTimeout = null
let isConnecting = false
globalThis.EventSource = EventSource

// I don't know at this point.
// Ref: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/client/sse.ts
// eventSourceInit.fetch() gives us control over how EventSource (used for SSE) is created
// and what request headers get sent...at least according to ChatGPT haha.
// TL;DR, from what I'm picking up, is that we're overriding the fetch to inject our headers
// not a huge fan of that.
async function connectMCP() {
  logger.info("attempting to connect to MCP server")
  if (isConnecting) {
    logger.debug("authorization already in progress")
    return
  }

  isConnecting = true

  const tokenData = await fetchAccessToken()

  if (!tokenData) {
    logger.warn(
      "No Access Token retrieved from authentication server, MCP features disabled"
    )
    isConnecting = false
    return
  }

  mcpToken = tokenData.token
  const now = Math.floor(Date.now() / 1000)
  const msUntilRefresh = (tokenData.expiresAt - now - 30) * 1000
  logger.info(
    `Next token refresh scheduled in ${Math.floor(
      msUntilRefresh / 1000
    )} seconds`
  )
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
  }
  reconnectTimeout = setTimeout(connectMCP, msUntilRefresh)
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
    await mcpClient.close() // Close any existing connections for refresh token or on boot
    logger.info("Closed MCP connection")
  } catch (error) {
    logger.warn("No existing MCP connection to close, or error closing:", error)
  }

  // re-initialize connection
  mcpClient = new McpClient(
    { name: "morgana", version: "4.0" },
    { capabilities: {} }
  )

  try {
    await mcpClient.connect(transport)
    logger.info("MCP connected!")
    const tools = await mcpClient.listTools()
    logger.debug("Available tools from MCP:", tools)
    isConnecting = false
    return mcpClient
  } catch (err) {
    logger.error("Failed to connect MCP:", err)
    logger.warn(
      "MCP server is unreachable. MCP tools will be unavailable."
    )
    logger.debug("MCP Client", mcpClient)
    isConnecting = false
    return null
  }
}

client.once("ready", function () {
  logger.info("bot initialized")
  client.user.setPresence({
    activities: [{ name: "over Cafe LeBlanc", type: ActivityType.Watching }],
  })
})

// Intercept regular messages for stock and subreddit hotlinking
client.on("messageCreate", async (message) => {
  if (respondAnywhere === "false") {
    //Check if we're in the targeted chatgpt channel
    if (
      !message.author.bot &&
      message.channel.id == process.env.CHATGPT_CHANNEL &&
      !message.content.startsWith("!")
    ) {
      chatgpt(message, openAI, client, mcpClient)
    }
  } else {
    // Make morgana respond only if he's mentioned
    if (
      !message.author.bot &&
      !message.content.startsWith("!") &&
      message.mentions.members.has(client.user.id)
    ) {
      logger.debug("I was mentioned! I should respond.")
      chatgpt(message, openAI, client, mcpClient)
    }
  }

  // Don't handle anything from a bot
  if (!message.author.bot) {
    if (containsStock(message.content)) {
      getStonks(message)
    }

    if (containsSubreddit(message.content)) {
      sublinker(message)
    }
  }
})

// This is a little mean, but based on a targeted user, when they delete a message immediately repost it
client.on("messageDelete", async (message) => {
  if (process.env.SNIPE_USER_ID !== undefined) {
    if (message.author.id == process.env.SNIPE_USER_ID) {
      let content = message.content
      message.channel.send(
        "_SNIPED! This is what <@!" +
          process.env.SNIPE_USER_ID +
          "> said:_\n" +
          content
      )
    }
  }
})

/**
 * Slash command handler
 */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  // If the slash command isn't anything we know of at boot, ignore it
  const command = client.commands.get(interaction.commandName)
  if (!command) return

  try {
    await command.execute(interaction)
  } catch (error) {
    logger.error(error)
    await interaction.reply({ content: "Try again next time", ephemeral: true })
  }
})

process.on("SIGINT", () => {
  mcpClient.close()
  logger.info("Gracefully closed MCP connection")
  process.exit()
})

/**
 * Check if a message contains a stock ticker
 * @param {String} message The message content
 */
function containsStock(message) {
  let regex = /\$([A-Z])\w{0,4}\b/gim

  if (message.match(regex)) {
    return true
  } else {
    return false
  }
}

/**
 * Function to read through potential quick reddit links
 * @param {String} msg The string to parse
 */
function containsSubreddit(message) {
  const regex = /\b[rR]\/[a-z]*\b/gm
  const subreddits = message.match(regex)

  // Ignore if someone linked to reddit directly.
  if (message.includes("http")) {
    return false
  } else if (subreddits === null || subreddits.length == 0) {
    return false
  } else {
    return true
  }
}

logger.info(`Using log level: ${process.env.LOG_LEVEL || "info"}`)
connectMCP()
client.login(process.env.TOKEN)
