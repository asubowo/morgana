/**
 * @author Andrew Subowo
 * @version 4.0
 */

import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { Client, GatewayIntentBits, Collection, ActivityType } from 'discord.js'
import { OpenAI } from 'openai'
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { EventSource } from 'eventsource'
import { getStonks } from './commands/utils/stocks.js'
import { sublinker } from './commands/reddit/sublinker.js'
import { chatgpt } from './commands/utils/openai.js'
import { fileURLToPath } from 'url'
import { logger } from './utils/logger.js'

const respondAnywhere = process.env.RESPOND_ANYWHERE || false;
const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:9595/sse'
const mcpToken = process.env.MCP_SERVER_API_KEY
globalThis.EventSource = EventSource

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] })
client.commands = new Collection()
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = await import(`file://${filePath}`)
  client.commands.set(command.data.name, command)
}

// Create an instance of McpClient
let mcpClient = new McpClient({
  name: 'morgana', version: '4.0'
},
  { capabilities: {} },
)

// I don't know at this point.
// Ref: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/client/sse.ts
// eventSourceInit.fetch() gives us control over how EventSource (used for SSE) is created
// and what request headers get sent...at least according to ChatGPT haha.
// TL;DR, from what I'm picking up, is that we're overriding the fetch to inject our headers
// not a huge fan of that.
const transport = new SSEClientTransport(new URL(mcpServerUrl), {
  requestInit: {
    headers: mcpToken ? { authorization: `Bearer ${ mcpToken }`} : {}, // dont set auth headers if MCP key isn't set
  },
  eventSourceInit: {
    async fetch(input, init = {}) {
      const headers = new Headers(init.headers || {})
      if ( mcpToken ) {
        headers.set('authorization', `Bearer ${ mcpToken }`)
      }
      return fetch(input, {...init, headers})
    }
  }
})


async function connectMCP() {
  logger.info("attempting to connect to MCP server")
  try {
    await mcpClient.connect(transport)
    logger.info("MCP connected!")
    const tools = await mcpClient.listTools();
    logger.debug("Available tools from MCP:", tools)
    return mcpClient
  } catch (err) {
    logger.error("Failed to connect MCP:", err);
    logger.warn("MCP server is unreachable. MCP tools will be unavailable for the remainder of this instance.")
    logger.debug(mcpClient)
    return null;
  }
}

// OpenAI init
const openAI = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY,
});

client.once('ready', function () {
  logger.info('bot initialized');
  client.user.setPresence({
    activities: [{ name: 'over Cafe LeBlanc', type: ActivityType.Watching }]
  });
});

// Intercept regular messages for stock and subreddit hotlinking
client.on('messageCreate', async message => {
  if (respondAnywhere === "false") {
    //Check if we're in the targeted chatgpt channel
    if (!message.author.bot && message.channel.id == process.env.CHATGPT_CHANNEL && !message.content.startsWith('!')) {
      chatgpt(message, openAI, client, mcpClient)
    }
  } else {
    // Make morgana respond only if he's mentioned
    if (!message.author.bot && !message.content.startsWith('!') && (message.mentions.members.has(client.user.id))) {
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
client.on('messageDelete', async message => {
  if (process.env.SNIPE_USER_ID !== undefined) {
    if (message.author.id == process.env.SNIPE_USER_ID) {
      var content = message.content
      message.channel.send("_SNIPED! This is what <@!" + process.env.SNIPE_USER_ID + "> said:_\n" + content)
    }
  }
});

/**
 * Slash command handler
 */
client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;
  // If the slash command isn't anything we know of at boot, ignore it
  const command = client.commands.get(interaction.commandName)
  if (!command) return

  try {
    await command.execute(interaction)
  } catch (error) {
    logger.error(error)
    await interaction.reply({ content: "Try again next time", ephemeral: true })
  }
});

process.on('SIGINT', () => {
  mcpClient.close()
  logger.info("Gracefully closed MCP connection")
  process.exit()
});

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
  if (message.includes('http')) {
    return false
  }
  else if (subreddits === null || subreddits.length == 0) {
    return false
  } else {
    return true
  }
}

logger.info(`Using log level: ${process.env.LOG_LEVEL || 'info'}`)
connectMCP()
client.login(process.env.TOKEN); 
