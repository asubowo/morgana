/**
 * @author Andrew Subowo
 * @version 4.0
 * Now includes more AI - reticulating splines.
 */


import { Client, Message } from 'discord.js'
import { OpenAI } from 'openai'
import { logger } from '../../utils/logger.js'
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
const maxLength = 2000 // The current max character length of a Discord message

/**
 * Hit up OpenAI's API and await response.
 * @param {Message} messageContext The Discord message context
 * @param {OpenAI} openai The openai instance
 * @param {Client} client The Discord bot client instance
 * @param {McpClient} mcpClient The MCP Client reference
 */
export async function chatgpt(messageContext, openai, client, mcpClient) {
  logger.debug("Attempting chatgpt call")
  let typingStatus = null
  
  try {
    // Init Morgana with some context. Boy this was a weird context to init with.
    // Constantly refresh conversationHistory array
    let context = {
      role: "developer",
      content: "You are a chatbot cosplaying as Morgana from the video game Persona 5.\
      You will always speak in character, and never break character. If you need to, do so in character.\
      Ensure your responses are in character and don't make it seem as if you are reading from a script.\
      Do not prefix your responses with 'Morgana:' or 'Ah'. You will receive a parsed array of messages with their usernames attached to it.\
      Respond accordingly, using tone and style, but never break character."
    }

    let conversationHistory = [context]
    let reply = ''
    let prevMessages = await messageContext.channel.messages.fetch({ limit: 30 })
    prevMessages.reverse().forEach((msg) => {
      // Thanks Under Ctrl for the regex.
      const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '')

      // Ignore bots, but not himself, and if a message starts with '!'
      if (msg.content.startsWith('!') || (msg.author.id !== client.user.id && msg.author.bot)) return
      // Constantly base our responses off of past responses
      // fancy new operators
      conversationHistory.push({
        role: msg.author.id === client.user.id ? "assistant" : "user",
        name: username,
        content: msg.content,
      })
    })

    // Push context again, and send typing notif
    conversationHistory.push(context)
    await messageContext.channel.sendTyping()

    // Keep "typing" while API hasn't responded yet
    typingStatus = setInterval(() => {
      messageContext.channel.sendTyping()
    }, 5000)

    let tools = []
    try {
      const rawTools = await mcpClient.listTools()
      tools = transformTools(rawTools)
    } catch (error) {
      logger.warn("MCP tools are unavailable, continuing without them.")
      tools = []
    }
    
    const result = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: conversationHistory,
        tools: tools,
        tool_choice: 'auto'
      })
      .catch((error) => {
        messageContext.channel.send("I'm feeling a bit under the weather right now. Ask me again later...")
        clearInterval(typingStatus)
        logger.error(`OPENAI ERR:`, error)
        logger.debug("Chat history:")
        conversationHistory.forEach((msg) => {
          logger.debug(msg.content)
        })
      })

    if (!result) return
    
    reply = result.choices[0].message

    if (reply.tool_calls) {
      logger.debug("Tool call made")
      const toolCall = reply.tool_calls[0]
      const args = JSON.parse(toolCall.function.arguments)
    
      let toolResponseContent
    
      try {
        const toolResult = await mcpClient.callTool({
          name: toolCall.function.name,
          arguments: args,
        })
    
        toolResponseContent = toolResult.content
    
      } catch (toolError) {
        logger.error("TOOL ERROR:", toolError)
    
        // Fall back to GPT-only response
        const fallbackResponse = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            ...conversationHistory,
            { role: "assistant", content: "I couldn't fetch that info right now. Be honest and let them know you couldn't reach Futaba for the extra info, and don't know." }
          ]
        });
    
        const fallbackMessage = fallbackResponse.choices[0].message.content
        respond(fallbackMessage, messageContext)
        clearInterval(typingStatus)
        return
      }
      
      const followup = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          ...conversationHistory,
          { role: "assistant", tool_calls: [toolCall] },
          { role: "tool", tool_call_id: toolCall.id, content: toolResponseContent },
        ]
      })
    
      const finalMessage = followup.choices[0].message.content
      respond(finalMessage, messageContext)
      clearInterval(typingStatus)
      return
    }

    respond(reply.content, messageContext)
    clearInterval(typingStatus)
  } catch (error) {
    logger.error("CHATGPT ERR:", error)
    clearInterval(typingStatus)
    await messageContext.channel.send("Morgana's feeling sleepy... zZz. Try again in a bit.")
  }
}

/**
 * Main response method that does auto chunking
 * @param {String} responseContent 
 * @param {Message} messageContext 
 */
async function respond(responseContent, messageContext) {
  if (responseContent.length > maxLength) {
    const chunks = splitMessage(responseContent, maxLength)
    for (const chunk of chunks) {
      await messageContext.channel.sendTyping()
      await messageContext.channel.send(chunk)
    }
  } else {
    await messageContext.channel.send(responseContent)
  }
}

/**
 * We'd like to be able to give responses more than 2000 characters if we need.
 * This function returns an array containing chunks of words. This array essentially represents how
 *    many follow up messages we send back to Discord.
 * @param {String} inputString The string to be cut into chunks
 * @param {Integer} maxLength The max character length (dynamic, of course and not hardcoded to Discords 2k limit)
 * @returns {string[]}
 */
function splitMessage(inputString, maxLength) {
  // Check if the input string is already within the character limit
  if (inputString.length <= maxLength) {
    return [inputString]
  }

  const words = inputString.split(" ")
  const chunks = [];
  let currentChunk = "" // currentChunk represents a chunk of words

  // This is weird, but iterate through the entire response split by spaces
  for (const word of words) {
    // Given our current chunk, see if adding the word "including a space" would go over our character limit
    if (currentChunk.length + word.length + 1 <= maxLength) { // +1 for space character
      if (currentChunk !== "") {
        currentChunk += " "
      }
      currentChunk += word // Add word to current chunk we're on
    } else {
      chunks.push(currentChunk) // If we'd go over the character limit, stop, and create a new chunk
      currentChunk = word
    }
  }

  // Add last remaining chunk to array
  if (currentChunk !== "") {
    chunks.push(currentChunk)
  }

  return chunks
}

function transformTools(rawTools) {
  // Check if rawTools is an object with a 'tools' property that is an array
  if (rawTools && Array.isArray(rawTools.tools)) {
    return rawTools.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema, // Use inputSchema for parameters
      }
    }))
  }

  // If rawTools doesn't have the correct structure, log and return an empty array
  logger.error("Invalid tools format", rawTools)
  return []
}