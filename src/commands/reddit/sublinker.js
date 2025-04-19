/**
 * @author Andrew Subowo
 * @since 2.0
 */

import Message from 'discord.js'

/**
 * Given a Discord message, determine if a subreddit is present and return a simple URL
 * @param {Message} messageContext 
 * @returns A message to the channel with a URL to the subreddit
 */
export async function sublinker(messageContext) {
  const regex = /([^a-z\s\/]|\b)[rR]\/\w+/gm;
  const subreddits = messageContext.content.match(regex);
  return await messageContext.channel.send('https://www.reddit.com/' + subreddits[0].toLowerCase());
}