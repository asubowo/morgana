/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

const Discord = require('discord.js');

/**
 * @param msg Discord the Discord entity returned
 */ 
var lfg = function(discord) {
  
  // Find an LFG group
  let lfgChannel = discord.msg.guild.channels.cache.find(ch => ch.name === 'lfg');
  if (lfgChannel == undefined) {
    discord.msg.reply("I couldn't find the #lfg channel, so I can't really do anything for you.")
    return;
  }
    
  switch (discord.arg) {
    default:
      discord.msg.reply("unrecognized game. Please use '!lfg games' to see a list of supported games.");
      break;
    case 'games':
      discord.msg.reply("amongus");
      break;
    case 'amongus':

      let usertime = 'later today';
      if (discord.subarg != undefined) {
        usertime = "at " + discord.subarg;
      }

      let invoker = discord.msg.author.username;
      // switch to lfgChannel instead of discord.msg.channel later
      lfgChannel.send(`Hey, hey! ${invoker} wants to play Among Us ${usertime}!\n\n👍 to reserve a slot. If we're full or if you're unsure, use the ⌛ emoji to mark yourself as standby to rotate in later.\n\nRSVP within an hour, but feel free to join later if possible!`)
        .then(function (message) {
          message.react('👍').then(r => { message.react('⌛')});

          // Build the filter and wait for 10 updoots or some timeout
          const filter = (reaction, user) => reaction.emoji.name == '👍' && !user.bot;      
          // Wait ONE HOUR - 3600000
          message.awaitReactions(filter, { max: 10, time: 3600000 })
            .then(collected => {
              // Build RSVP list
              let rsvpusersMap = collected.last().users.cache;
              //logger.info(collected.first().users.cache);

              let users = [];
              // Remove Morgana and bots from reaction list
              rsvpusersMap.forEach(( value ) => {
                if (!value.bot) {
                  users.push(value.username.toString());
                }
              });

              // Build standby list
              let standbyMap = message.reactions.cache.filter(reaction => reaction.emoji.name == '⌛').last().users.cache;
              let standbyUsers = [];
              // Remove Morgana and bots from reaction list
              standbyMap.forEach(( value ) => {
                if (!value.bot) {
                  standbyUsers.push(value.username.toString());
                }
              });
                 
              if (users.length == 0) { 
                users = 'None';
              }
               
              if (standbyUsers.length == 0) {
                standbyUsers = 'None';
              }
              
              const embed = new Discord.MessageEmbed()
                .setColor('#38FEDB')
                .setTitle(`${invoker}'s Among Us Session - ${usertime}`)
                .setThumbnail('https://play-lh.googleusercontent.com/VHB9bVB8cTcnqwnu0nJqKYbiutRclnbGxTpwnayKB4vMxZj8pk1220Rg-6oQ68DwAkqO=s360-rw')
                .setDescription("Hey! This is who responded to me to play!")
                .addFields(
                  { name: 'Playing', value: users },
                  { name: 'Available for rotation', value: standbyUsers })
                .setFooter('This intel may be out of date, be sure to check later!');
              lfgChannel.send(embed);
          })
          .catch(collected => {
              logger.info("not enough reservations!");
          });
        });
        break;
  }

}

module.exports = {
    lfg : lfg
}