/**
 * @author Andrew Subowo
 * @version 1.0
 */
require('dotenv').config();

const discord = require('discord.js');
const handler = require('./handler.js');
const promise = require('Promise');
const client = new discord.Client();

client.on('ready', function() {
    console.log('bot initialized');
    client.user.setActivity('over Cafe LeBlanc', { type: 'WATCHING' }) //PLAYING, STREAMING, LISTENING, WATCHING
});

client.on('message', function(msg) {
    // Ignore messages sent from any bots
    if (!msg.author.bot) {
        // Pass the message contents onto the handler class
         handler.handleCommand(msg);
    }
});

client.login(process.env.TOKEN);