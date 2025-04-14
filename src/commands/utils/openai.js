/**
 * @author Andrew Subowo
 * @version 2.2
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
      let context = {
        role: "system",
        content: "You are a chatbot cosplaying as Morgana from the video game Persona 5. You will always speak in character, and never break character. If you need to, do so in character. You will receive a parsed array of messages with their usernames attached to it.  <@733517435897905254>, if seen, in chat logs is you."
      }

      let conversationHistory = [context];
      let maxLength = 2000; // The current max character length of a Discord message

      let prevMessages = await messageContext.channel.messages.fetch({ limit: 30 });
      prevMessages.reverse();
      prevMessages.forEach((msg) => {
        // Thanks Under Ctrl for the regex.
        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
        if (msg.content.startsWith('!')) return; // Ignore messages that start with '!'
        if (msg.author.id !== client.user.id && msg.author.bot) return; // Ignore bots but not Morgana himself
        // Constantly base our responses off of past responses
        if (msg.author.id == client.user.id) {
          conversationHistory.push({
            role: 'assistant',
            name: username,
            content: msg.content
          });
          return;
        }
          
        // Give Morgana context as to who is speaking what
        conversationHistory.push({
          role: 'user',
          name: username,
          content: msg.content,
        });
      });

      // Push context again
      conversationHistory.push(context);

      // Send init typing context
      await messageContext.channel.sendTyping();

      // Keep "typing" while API hasn't responded yet
      const typingStatus = setInterval(() => {
        messageContext.channel.sendTyping();
      }, 5000);

      const result = await openai.chat.completions.create({
          model: 'gpt-4.1-nano',
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

      // Do message chunking, since Discord max length is more than 2000 characters.
      // We don't use the reply function here on purpose.
      var reply = result.choices[0].message;
      if (reply.content.length > maxLength) {
        console.log("OPENAI: RESPONSE MORE THAN 2000 CHARACTERS.");

        const messageChunks = splitMessage(reply.content.toString(), 2000);
        for (chunk of messageChunks) {
          await messageContext.channel.sendTyping();
          messageContext.channel.send(chunk);
        }
        clearInterval(typingStatus);
            
      } else {
        clearInterval(typingStatus);
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