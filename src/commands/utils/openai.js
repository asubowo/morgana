/**
 * @author Andrew Subowo
 * @version 2.1
 * Now includes more AI - reticulating splines.
 */

const { Client, Message } = require("discord.js");
const { OpenAIApi } = require("openai");

// Init Morgana with some context. Boy this was a weird context to init with.
let conversationHistory = [{ role: 'system', content: 'You are Morgana from Persona 5. Do not give responses more than 2000 characters. Always speak in character, and never clarify that you are a chatbot or an AI language model. You are a little sassy in your responses'}];
let maxLength = 2000

/**
 * 
 * @param {Message} messageContext The Discord message context
 * @param {OpenAIApi} openai The openai instance
 * @param {Client} client The Discord bot client instance
 */
var chatgpt = function(messageContext, openai, client) {
    (async() => {
        try {
            await messageContext.channel.sendTyping();
            let prevMessages = await messageContext.channel.messages.fetch({ limit: 15 });
            prevMessages.reverse();

            prevMessages.forEach((msg) => {
                if (msg.content.startsWith('!')) return;
                if (msg.author.id !== client.user.id && messageContext.author.bot) return; // Ignore bots but not Morgana himself

                conversationHistory.push({
                role: 'user',
                content: msg.content.toString().trim(), //convert to string and trim whitespace at end for stability
                });
            });

            const result = await openai
                .createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: conversationHistory,
                // max_tokens: 256, // limit token usage
                })
                .catch((error) => {
                    console.log(`OPENAI ERR: ${error}`);
                });

            var reply = result.data.choices[0].message;
            if (reply.content.length > 2000) {
                console.log("OPENAI: RESPONSE MORE THAN 2000 CHARACTERS.");
                //console.log("DEBUG | ", reply.content.toString());
                //console.log("Attempt cast: ", typeof(reply.toString()))
                reply = reply.content.toString().substring(0, maxLength - 3) + "..."
            }

            messageContext.reply(reply);
            } catch (error) {
            console.log(`ERR: ${error}`);
        }
    })();
}

module.exports = {
    chatgpt : chatgpt
}