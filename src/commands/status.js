/**
 * @author Subtype
 * @version 4.0
 */

import { SlashCommandBuilder, CommandInteraction } from "discord.js"
import { logger } from "../utils/logger.js"
import { getMCPClient, connectMCP } from "../utils/mcpClient.js"

export const data = new SlashCommandBuilder()
  .setName("health")
  .setDescription("Check Morgana's health and status")

/**
 * I don't think this will work tbh
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
  // on close the mcp client should be returned null or ""
  // attempt a connection
  await connectMCP()
  let mcpClient = getMCPClient()
  if (!mcpClient) {
    await interaction.reply("❌ Not connected to MCP server.")
    return
  }

  try {
    const tools = await mcpClient.listTools()
    const toolsJSON = tools.tools
    await interaction.reply(
      "**MCP Status**\n" +
        "- ✅ Connected to MCP Server\n" +
        `- 🛠️ Registered tools: ${
          toolsJSON.map((t) => `\`${t.name}\``).join(", ") || "None"
        }`
    )
  } catch (err) {
    logger.error(err)
    await interaction.reply("⚠️ Connection to MCP Server is wonky")
  }
}
