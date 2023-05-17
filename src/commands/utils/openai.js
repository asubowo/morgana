/**
 * @author Andrew Subowo
 * @version 2.1
 * Now includes more AI - reticulating splines.
 */

const { Client, Message } = require("discord.js");
const { OpenAIApi } = require("openai");

/**
 * Hit up OpenAI's API and await response.
 * @param {Message} messageContext The Discord message context
 * @param {OpenAIApi} openai The openai instance
 * @param {Client} client The Discord bot client instance
 */
var chatgpt = function(messageContext, openai, client) {
    (async() => {
        try {
            // Init Morgana with some context. Boy this was a weird context to init with.
            // Constantly refresh conversationHistory array
            let conversationHistory = [{ role: 'system', content: 'You are Morgana from Persona 5. Do not give responses more than 2000 characters. Always speak in character, and never clarify that you are a chatbot or an AI language model. You are a little sassy in your responses'}];
            let maxLength = 2000;

            let prevMessages = await messageContext.channel.messages.fetch({ limit: 15 });
            prevMessages.reverse();
            prevMessages.forEach((msg) => {
                if (msg.content.startsWith('!')) return;
                if (msg.author.id !== client.user.id && messageContext.author.bot) return; // Ignore bots but not Morgana himself

                conversationHistory.push({
                    role: 'user',
                    content: msg.content, //convert to string and trim whitespace at end for stability
                });
            });

            await messageContext.channel.sendTyping();
            const result = await openai
                .createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: conversationHistory,
                // max_tokens: 256, // limit token usage
                })
                .catch((error) => {
                    console.log(`OPENAI ERR: ${error}`);
                    console.log("Chat history:");
                    conversationHistory.forEach((msg) => {
                        console.log(msg.content)
                    })
                });

            var reply = result.data.choices[0].message;
            if (reply.content.length > 2000) {
                console.log("OPENAI: RESPONSE MORE THAN 2000 CHARACTERS.");

                const messageChunks = splitMessage(reply.content.toString(), 2000);

                for (chunk of messageChunks) {
                    await messageContext.channel.sendTyping();
                    messageContext.channel.send(chunk);
                }
                // reply = reply.content.toString().substring(0, maxLength - 3) + "...";
            } else {
                messageContext.reply(reply);
            }
            } catch (error) {
            console.error(`ERR: ${error}`);
        }
    })();
}

/**
 * We'd like to be able to give responses more than 2000 characters if we need.
 * This function returns an array containing chunks of words. This array essentially represents how
 *    many follow up messages we send back to Discord.
 * @param {String} inputString The string to be cut into chunks
 * @param {Integer} maxLength The max character length (dynamic, of course and not hardcoded to Discords 2k limit)
 * @returns 
 */
function splitMessage(inputString, maxLength) {
    // Check if the input string is already within the character limit
    if (inputString.length <= maxLength) {
      return [inputString];
    }
  
    const words = inputString.split(" ");
    const chunks = [];
    let currentChunk = ""; // currentChunk represents a chunk of words
  
    // This is weird, but iterate through the entire response split by spaces
    for (const word of words) {
      // Given our current chunk, see if adding the word "including a space" would go over our character limit
      if (currentChunk.length + word.length + 1 <= maxLength) { // +1 for space character
        if (currentChunk !== "") {
          currentChunk += " ";
        }
        currentChunk += word; // Add word to current chunk we're on
      } else {
        chunks.push(currentChunk); // If we'd go over the character limit, stop, and create a new chunk
        currentChunk = word;
      }
    }
  
    // Add last remaining chunk to array
    if (currentChunk !== "") {
      chunks.push(currentChunk);
    }
  
    return chunks;
  }

module.exports = {
    chatgpt : chatgpt
}