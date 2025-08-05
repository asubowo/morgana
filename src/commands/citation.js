/**
 * @author Andrew Subowo
 * @version 4.1
 * Add citation integration - thank you Blockzilla101 for the library
 */

import { SlashCommandBuilder, CommandInteraction, AttachmentBuilder } from "discord.js"
import { logger } from "../utils/logger.js"
import { Citation } from "@blockzilla101/citation"

export const data = new SlashCommandBuilder()
  .setName("citation")
  .setDescription("Generate citations to ticket your discord members")
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("The citation text to render")
      .setRequired(true)
  )


/**
 *
 * @param {CommandInteraction} interaction
 * @returns A Discord Embed holding the result
 */
export async function execute(interaction) {
  const reason = interaction.options.getString("reason")

  const citation = new Citation()
  citation.reason = reason

  logger.info("Generating citation")

  // This returns a Buffer
  const gifBuffer = await citation.render("citation.gif", true)

  const attachment = new AttachmentBuilder(gifBuffer, { name: "citation.gif" })

  return interaction.reply({ files: [attachment] })
}
