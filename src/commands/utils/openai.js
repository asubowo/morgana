/**
 * @author Andrew Subowo
 * @version 2.2
 * Now includes more AI - reticulating splines.
 */

const { Client, Message } = require("discord.js");
const { OpenAI } = require("openai");

// Define tools available via MCP
const tools = [
  {
    type: 'function',
    function: {
      name: 'get-forecast',
      description: 'Gets the weather forecast for a given location',
      parameters: {
        type: 'object',
        properties: {
          latitude: {
            type: 'string',
            description: 'Latitude of the location'
          },
          longitude: {
            type: 'string',
            description: 'Longitude of the location'
          }
        },
        required: ['latitude', 'longitude']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'get-alerts',
      description: 'Get weather alerts for a state',
      parameters: {
        type: 'object',
        properties: {
          state: {
            type: 'string',
            description: 'Two-letter state code (e.g. CA, NY)'
          }
        },
        required: ['state']
      }
    }
  }
]

/**
 * Hit up OpenAI's API and await response.
 * @param {Message} messageContext The Discord message context
 * @param {OpenAI} openai The openai instance
 * @param {Client} client The Discord bot client instance
 */
var chatgpt = function(messageContext, openai, client) {
  (async() => {
    try {
      // Init Morgana with some context. Boy this was a weird context to init with.
      // Constantly refresh conversationHistory array
      let context = {
        role: "developer",
        content: "You are a chatbot cosplaying as Morgana from the video game Persona 5. You will always speak in character, and never break character. If you need to, do so in character. Ensure your responses are in character and don't make it seem as if you are reading from a script. Do not prefix your responses with 'Morgana:' or 'Ah'. You will receive a parsed array of messages with their usernames attached to it. Remember, please respond in character and do not allude that you are a chat bot. If you need to refuse a request, do it in character."
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
          tools,
          tool_choice: 'auto', // let gpt decide what to use whenever
          
        })
        .catch((error) => {
          messageContext.channel.send("I'm feeling a bit under the weather right now. Ask me again later...")
          clearInterval(typingStatus)
          console.log(`OPENAI ERR: ${error}`);
          console.log("Chat history:");
          conversationHistory.forEach((msg) => {
            console.log(msg.content)
          })
          console.log(result)
        });

      // Do message chunking, since Discord max length is more than 2000 characters.
      // We don't use the reply function here on purpose.
      var reply = result.choices[0].message;


      if (reply.tool_calls) {
        const toolCall = reply.tool_calls[0];
        const args = JSON.parse(toolCall.function.arguments);

        if (toolCall.function.name === 'get-forecast') {
          const weather = await fetch(`http://mcp-server.local/api/weather`, {
            method: 'POST',
            body: JSON.stringify({ latitude: args.latitude }, { longitude: args.longitude }),
            headers: { 'Content-Type': 'application/json' },
          }).then(res => res.json)
        }

        const followup = await openai.chat.completions.create({
          model: 'gpt-4.1-nano',
          messages: [
            ...conversationHistory,
            {
              role: 'assistant',
              tool_calls: [toolCall],
            },
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(weather),
            }
          ]
        })

        const finalMessage = followup.choices[0].message.content
        messageContext.channel.send(finalMessage);
      }
      else {
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