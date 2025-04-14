/**
 * @author Andrew Subowo
 * @version 3.2
 */
require('dotenv').config({ path: '.env' });

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

const { OpenAI } = require('openai');

const fs = require('node:fs');
const path = require('node:path');
const stocks = require('./commands/utils/stocks.js');
const sublinker = require('./commands/reddit/sublinker.js');
const chatgptinator = require('./commands/utils/openai.js');
const respondAnywhere = process.env.RESPOND_ANYWHERE || false;

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// OpenAI init
const openAI = new OpenAI({
    apiKey: process.env.CHATGPT_API_KEY,
});

client.once('ready', function () {
    console.log('bot initialized');
    client.user.setPresence({
        activities: [{ name: 'over Cafe LeBlanc', type: ActivityType.Watching }]
    });
});

// Intercept regular messages for stock and subreddit hotlinking
client.on('messageCreate', async message => {

    if (!respondAnywhere) {
        //Check if we're in the targeted chatgpt channel
        if (!message.author.bot && message.channel.id == process.env.CHATGPT_CHANNEL && !message.content.startsWith('!')) {
            chatgptinator.chatgpt(message, openAI, client);
        }
    } else {
        // Make morgana able to respond in any channel when summoned by mentioning him by name first in the message
        if (!message.author.bot && !message.content.startsWith('!') && (message.content.startsWith('Morgana') || message.content.startsWith('morgana'))) {
            chatgptinator.chatgpt(message, openAI, client);
        }
    }

    // Don't handle anything from a bot
    if (!message.author.bot) {
        if (containsStock(message.content)) {
            stocks.getStonks(message);
        }

        if (containsSubreddit(message.content)) {
            sublinker.sublinker(message);
        }
    }
});

// This is a little mean, but based on a targeted user, when they delete a message immediately repost it
client.on('messageDelete', async message => {
    if (process.env.SNIPE_USER_ID !== undefined) {
        if (message.author.id == process.env.SNIPE_USER_ID) {
            var content = message.content;
            message.channel.send("_SNIPED! This is what <@!" + process.env.SNIPE_USER_ID + "> said:_\n" + content);
        }
    }
});

/**
 * Slash command handler
 */
client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;
    // If the slash command isn't anything we know of at boot, ignore it
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: "Try again next time", ephemeral: true });
    }
});

/**
 * 
 * @param {String} message The message content
 */
function containsStock(message) {
    let regex = /\$([A-Z])\w{0,4}\b/gim;

    if (message.match(regex)) {
        return true;
    } else {
        return false;
    }
}

/**
 * Function to read through potential quick reddit links
 * @param {String} msg The string to parse
 */
function containsSubreddit(message) {
    const regex = /\b[rR]\/[a-z]*\b/gm;
    const subreddits = message.match(regex);

    // Ignore if someone linked to reddit directly.
    if (message.includes('http')) {
        return false;
    }
    else if (subreddits === null || subreddits.length == 0) {
        return false;
    } else {
        return true;
    }
}

client.login(process.env.TOKEN); 
