/**
 * @author Andrew Subowo
 * @version 4.0
 */

import "./utils/env.js"
import fs from "fs"
import path from "path"
import { Client, GatewayIntentBits, Collection, ActivityType } from "discord.js"
import { OpenAI } from "openai"

import { getStonks } from "./commands/utils/stocks.js"
import { sublinker } from "./commands/reddit/sublinker.js"
import { chatgpt } from "./commands/utils/openai.js"
import { fileURLToPath } from "url"
import { logger } from "./utils/logger.js"
import { connectMCP, getMCPClient, stopMCP } from "./utils/mcpClient.js"

const respondAnywhere = process.env.RESPOND_ANYWHERE || false
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

let mcpClient = null

client.commands = new Collection()
// command set
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = await import(`file://${filePath}`)
  client.commands.set(command.data.name, command)
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
      await connectMCP()
      chatgpt(message, openAI, client)
    }
  } else {
    // Make morgana respond only if he's mentioned
    if (
      !message.author.bot &&
      !message.content.startsWith("!") &&
      message.mentions.members.has(client.user.id)
    ) {
      logger.debug("I was mentioned! I should respond.")
      await connectMCP()
      chatgpt(message, openAI, client)
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
try {
  await connectMCP()
  mcpClient = getMCPClient()
  client.login(process.env.TOKEN)
} catch (err) {
  logger.error("Failed to initialize Morgana!", err)
}

process.on("SIGINT", async () => {
  await stopMCP()
  logger.info("Gracefully closed MCP connection")
  process.exit()
})