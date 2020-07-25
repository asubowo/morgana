/**
 * @author Andrew Subowo
 * @author Kevin Pfeifle (thanks kevin!)
 * @version 1.0
 */
const commands = require('./router.js');
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
        commands.sublinker.sublinker(results);
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
          commands.audio.audio(results);
          break;
          
      } 
    })
}
  
module.exports = {
    handleCommand : handleCommand
}