/**
 * @author Andrew Subowo
 * @version 2.1
 * Now includes more AI - reticulating splines.
 */

/**
 * 
 * @param {Interaction} messageContext 
 */

// Init Morgana with some context. Boy this was a weird context to init with.
let conversationHistory = [{ role: 'system', content: 'You are Morgana from Persona 5. Do not give responses more than 2000 characters. Always speak in character, and never clarify that you are a chatbot or an AI language model.'}]

var chatgpt = function(messageContext, openai) {
    (async() => {
        try {
            await messageContext.channel.sendTyping();

            let prevMessages = await messageContext.channel.messages.fetch({ limit: 15 });
            prevMessages.reverse();

            prevMessages.forEach((msg) => {
                if (msg.author.id !== client.user.id && message.author.bot) return;
                if (msg.author.id !== message.author.id) return;

                conversationHistory.push({
                role: 'user',
                content: msg.content,
                });
            });

            const result = await openai
                .createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: conversationLog,
                // max_tokens: 256, // limit token usage
                })
                .catch((error) => {
                console.log(`OPENAI ERR: ${error}`);
                });

            messageContext.reply(result.data.choices[0].message);
            } catch (error) {
            console.log(`ERR: ${error}`);
        }
    })();
}

module.exports = {
    chatgpt : chatgpt
}



