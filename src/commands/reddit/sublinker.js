/**
 * @author Andrew Subowo
 * @since 2.0
 */

/**
 * 
 */
async function sublinker(messageContext) {
  const regex = /([^aA-zZ\s\/]|\b)[rR]\/\w+/gm;
  const subreddits = messageContext.content.match(regex);
  return await messageContext.channel.send('https://www.reddit.com/' + subreddits[0].toLowerCase());
}

module.exports = {
    sublinker : sublinker
}