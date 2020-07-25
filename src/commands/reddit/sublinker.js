/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

/**
 * @param msg The msg body
 */
var sublinker = function(command) {
    const regex = /r\/[aA-zZ]*/gm;
    const subreddits = command.msg.content.match(regex);
    console.log(subreddits[0]);
    command.msg.channel.send('https://www.reddit.com/' + subreddits[0]);
  }

module.exports = {
    sublinker : sublinker
}