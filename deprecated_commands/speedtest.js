/**
 * @author Andrew Subowo
 * @version 2.0
 * Now supports slash commands!
 */

const { EmbedBuilder, SlashCommandBuilder, CommandInteraction} = require('discord.js');
const test = require('speedtest-net');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('speedtest')
    .setDescription('Runs a speedtest where Morgana is being ran from'),

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @returns An embed representing the data of the speedtest
     */
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false});

      try {
        options = { acceptLicense: 'True' }
        results = await test(options)

        latency = results['ping']['latency'].toString();
        uploadBytes = results['upload']['bytes'];
        downloadBytes = results['download']['bytes'];
        serverLocation = results['server']['location'];
        serverName = results['server']['name'];
  
        upload = (uploadBytes / (1024 * 1024)).toFixed(2);
        download = (downloadBytes / (1024 * 1024)).toFixed(2);
  
        if (process.env.SERVER_NAME) {
          localName = process.env.SERVER_NAME;
        } else {
          localName = "Morgana's Network";
        }

        console.log
        const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(localName + ' - Network Speed Test')
        .addFields(
          { name: 'Server Name', value: serverName },
          { name: 'Server Location', value: serverLocation },
          { name: 'Latency (ms)', value: latency },
          { name: 'Download (Mbps)', value: download },
          { name: 'Upload (Mbps)', value: upload }
        )
        .setFooter({ text: 'Powered by Speedtest.net' });

        return interaction.editReply({ embeds: [embed] });
      } catch(err) {
          console.error(err);
          return interaction.editReply('The speedtest is unavailable at this time');
      }
    }
}