/**
 * @author Andrew Subowo
 * @author Kevin Pfeifle (thanks kevin!)
 * @version 1.0
 */
const router = require('./router.js');
var DiscordWrapper = require('./discordWrapper.js');

/**
 * Determines which command was chosen, and calls it.
 * @param msg the message that was sent.
 * @returns a promise to handle the command that was called.
 */
var handleCommand = function(msg) {
    return new Promise(function(resolve, reject) {
      resolve(new DiscordWrapper(msg));
    }).then(results => {

      if (results.subreddit) {
        router.sublinker.sublinker(results);
      }

      if (results.stock) {
        router.stocks.getStonks(results);
      }

      // Check for a valid command structure. If we don't have one, quit immediately.
      if (!results.isCommand) {
        return;
      }

      switch (results.command) {
        default:
          msg.reply('invalid command. Use !help for more information.');
          break;
        case '!audio':
          router.audio.audio(results);
          break;
        case '!breakup':
          router.breakup.getbreakups(results);
          break;
        case '!uwu':
          router.uwuinator.uwuinate(results);
          break;
        case '!roll':
          router.diceroll.roll(results);
          break;
        case '!help':
          router.help.getHelp(results);
          break;
        case '!speedtest':
          router.speedTest.speedTest(results);
          break;
        case '!lfg':
          router.lfg.lfg(results);
          break;
//        case '!morgana':
//          router.tama.mona(results);
//          break;
      } 
    })
}
  
module.exports = {
    handleCommand : handleCommand
}