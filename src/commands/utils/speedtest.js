/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

const Discord = require('discord.js');
const test = require('speedtest-net');

/**
 * Uses the speedtest-net module to hook into speedtest.net's API.
 * @param {Discord} discord - The discord instance to hook back into
 */
var speedTest = function (discord) {
  (async () => {
    try {
      discord.msg.react("⌛");
      options = { acceptLicense: 'True' }
      results = await test(options);

      latency = results['ping']['latency'];
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

      const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(localName + ' - Network Speed Test')
        .addFields(
          { name: 'Server Name', value: serverName },
          { name: 'Server Location', value: serverLocation },
          { name: 'Latency (ms)', value: latency },
          { name: 'Download (Mbps)', value: download },
          { name: 'Upload (Mbps)', value: upload }
        )
        .setFooter('Powered by Speedtest.net');
      discord.msg.channel.send(embed);
      discord.msg.reactions.removeAll();
      discord.msg.react("✅");

    } catch (err) {
      console.log(err.message);
      discord.msg.reactions.removeAll();
      discord.msg.react("❌");
      discord.msg.channel.send("The test failed. Try again at another time.");
    }
  })();
}

module.exports = {
  speedTest: speedTest
}