/**
 * @author Andrew Subowo
 * @version 2.0
 * Now supports slash commands!
 * Knowledge of NodeJS UP!!!!
 */
require('dotenv').config({ path: '../.env' });

const { Client, GatewayIntentBits, Collection, ActivityType, InteractionType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });
const fs = require('node:fs');
const path = require('node:path');
const stocks = require('./commands/utils/stocks.js');
const sublinker = require('./commands/reddit/sublinker.js');


client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}


client.once('ready', function () {
    console.log('bot initialized');
    client.user.setPresence({
        activities: [{ name: 'over Cafe LeBlanc', type: ActivityType.Watching }]
    });
});

// Intercept regular messages for stock and subreddit hotlinking
client.on('messageCreate', async message => {

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
        await interaction.reply({ content: "Try again next time", ephemeral: true })
    }
});

/**
 * 
 * @param {String} message The message content
 */
function containsStock(message) {
    let regex = /\$([aA-zZ])\w{0,4}\b/gim;

    if (message.match(regex)) {
        return true
    } else {
        return false
    }
}

/**
 * Function to read through potential quick reddit links
 * @param {String} msg The string to parse
 */
function containsSubreddit(message) {
    const regex = /[rR]\/[aA-zZ]*/gm;
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