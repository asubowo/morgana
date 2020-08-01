/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

/**
 * @param msg The msg body
 */
var sublinker = function(command) {
    const regex = /[rR]\/[aA0-zZ9]*/gm;
    const subreddits = command.msg.content.match(regex);
    command.msg.channel.send('https://www.reddit.com/' + subreddits[0].toLowerCase());
  }

module.exports = {
    sublinker : sublinker
}