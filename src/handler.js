/**
 * @author Andrew Subowo
 * @author Kevin Pfeifle (thanks kevin!)
 * @version 1.0
 */
const router = require('./router.js');
var Command = require('./command.js');

/**
 * Determines which command was chosen, and calls it.
 * @param msg the message that was sent.
 * @returns a promise to handle the command that was called.
 */
var handleCommand = function(msg) {
    return new Promise(function(resolve, reject) {
      resolve(new Command(msg));
    }).then(results => {

      if (results.subreddit) {
        router.sublinker.sublinker(results);
      }

      // Check for a valid command structure. If we don't have one, quit immediately.
      if (!results.isCommand) {
        return;
      }

      switch (results.command) {
        default:
          msg.reply('Invalid command.');
          break;
        case '!audio':
          router.audio.audio(results);
          break;
        case '!breakup':
          router.breakup.getbreakups(results);
          break;
      } 
    })
}
  
module.exports = {
    handleCommand : handleCommand
}