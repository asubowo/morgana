// For scenarios where you want to reconnect to an MCP server and Morgana has somehow disconnected

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import { logger } from '../../utils/logger'
import { connectMCP } from '../../morgana';


export const data = new SlashCommandBuilder()
  .setName('mcp')
  .setDescription('Perform administrative actions for Morgana and an MCP Server')
  .addSubcommand(subcommand =>
    subcommand
      .setName('reconnect')
      .setDescription("Attempt to reconnect to Morgana's configured MCP server"))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)


export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: false });
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'reconnect') {
    try {
      await connectMCP()
    } catch (error) {
      logger.error(error)
    }
  }

}