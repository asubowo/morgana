/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

/**
 * Automatically appends the detected subreddit to a clickable link
 * e.g. r/test => https://www.reddit.com/r/test
 * @param {DiscordWrapper} discord 
 */
var sublinker = function(discord) {
    const regex = /[rR]\/[aA0-zZ9]*/gm;
    const subreddits = discord.msg.content.match(regex);
    discord.msg.channel.send('https://www.reddit.com/' + subreddits[0].toLowerCase());
  }

module.exports = {
    sublinker : sublinker
}