/**
 * @author Subtype
 * @version 4.0
 */

import { SlashCommandBuilder, CommandInteraction } from "discord.js"
import { getMCPClient } from "../utils/mcpClient.js"

export const data = new SlashCommandBuilder()
  .setName("health")
  .setDescription("Check Morgana's health and status")

/**
 * I don't think this will work tbh
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
  const mcpClient = getMCPClient()
  if (!mcpClient?.transport?.sessionId) {
    await interaction.reply("❌ Not connected to MCP server.")
    return
  }

  try {
    const tools = await mcpClient.listTools()
    await interaction.channel.send(
      "**MCP Status**\n" +
        "- ✅ Connected to MCP Server\n" +
        `- 🛠️ Registered tools: ${
          tools.map((t) => `\`${t.name}\``).join(", ") || "None"
        }`
    )
  } catch (err) {
    await interaction.reply("⚠️ Connection to MCP Server is wonky")
  }
}
