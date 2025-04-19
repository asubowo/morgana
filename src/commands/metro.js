/*
 * @author Andrew Subowo
 * @version 2.0 Introduced /metro commands to pull metro data from WMATA APIs
 */

// commands/metro.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js'
import https from 'https';

const PRIMARY_API_KEY = process.env.WMATA_PRIMARY_KEY;

/**
 * Emoji color mapping
 * @param {String} line The line to search for
 */
function getColor(line) {
  const lineMap = new Map([
    ['RD', '🔴'],
    ['OR', '🟠'],
    ['YL', '🟡'],
    ['GR', '🟢'],
    ['BL', '🔵'],
    ['SV', '⚪']
  ]);
  return lineMap.get(line);
}

export const data = new SlashCommandBuilder()
  .setName('metro')
  .setDescription('Get WMATA information')
  .addSubcommand(subcommand =>
    subcommand
      .setName('station')
      .setDescription('Get station info')
      .addStringOption(option =>
        option.setName('stationname')
          .setDescription('The station name to select')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('Get rail service statuses from WMATA.'));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: false });
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'status') {
    const get_options = {
      host: 'api.wmata.com',
      port: 443,
      path: '/Incidents.svc/json/Incidents',
      headers: { 'api_key': PRIMARY_API_KEY }
    };

    let embed = new EmbedBuilder();

    https.get(get_options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        const res = JSON.parse(data);
        embed.setColor('#0099ff')
          .setTitle('Washington Metro Status Updates')
          .setURL('https://www.wmata.com/service/status/')
          .setAuthor({ name: 'WMATA', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/WMATA_Metro_Logo.svg/800px-WMATA_Metro_Logo.svg.png' })
          .setTimestamp();

        for (let incident of res.Incidents) {
          const lineAffected = incident.LinesAffected.split(';')[0];
          embed.addFields({
            name: `${getColor(lineAffected)} ${lineAffected}`,
            value: incident.Description
          });
        }

        return interaction.editReply({ embeds: [embed] });
      });

      resp.on('error', (err) => {
        logger.error(err);
        return interaction.editReply({ content: 'This service is not available at this time.', ephemeral: true });
      });
    });
  }

  if (subcommand === 'station') {
    const station = interaction.options.getString('stationname');
    const get_options = {
      host: 'api.wmata.com',
      port: 443,
      path: '/StationPrediction.svc/json/GetPrediction/All',
      headers: { 'api_key': PRIMARY_API_KEY }
    };

    https.get(get_options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        const res = JSON.parse(data);
        const stations = res.Trains.filter(train =>
          train.LocationName.toLowerCase().includes(station.toLowerCase()));

        if (stations.length === 0) {
          return interaction.editReply({ content: `No info was found for ${station}`, ephemeral: true });
        }

        let embed = new EmbedBuilder()
          .setTitle(stations[0].LocationName.toUpperCase())
          .setColor('#0099ff')
          .setURL('https://www.wmata.com/rider-guide/stations/')
          .setAuthor({ name: 'WMATA', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/WMATA_Metro_Logo.svg/800px-WMATA_Metro_Logo.svg.png' })
          .setTimestamp();

        for (let train of stations) {
          const value = train.Min === 'ARR' || train.Min === 'BRD'
            ? train.Min
            : `${train.Min} minutes`;

          embed.addFields({
            name: `${getColor(train.Line)} ${train.Line} ${train.Destination}`,
            value
          });
        }

        return interaction.editReply({ embeds: [embed] });
      });
    });
  }
}
