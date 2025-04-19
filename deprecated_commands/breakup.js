/**
 * @author Andrew Subowo
 * @version 2.0
 * Now supports slash commands!
 */
const https = require('https');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('breakup')
    .setDescription('Gets the amount of tweets to date about breakups'),
  async execute(interaction) {

    await https.get('https://labs.andrewsubowo.com/exidents/breakups', (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      
      resp.on('end', () => {
        const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Exidents Happen')
        .setURL('https://labs.andrewsubowo.com/exidents')
        .addFields(
          { name: 'Breakups', value: JSON.parse(data).breakups.toString() },
          { name: 'Since', value: JSON.parse(data).lastRecordedDate.toString() }
        )
        .setFooter({ text: 'Data provided by Subowo Labs - Subowo Labs is not responsible for relationship problems from correlated data.' });
          
        return interaction.reply({ embeds: [embed] });
      });
      
      resp.on('error', (err) => {
        logger.info(err);
      }); 
    })       
  }
}

