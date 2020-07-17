/**
 * @author Andrew Subowo
 * @version 1.0
 */

const discord = require('discord.js');
const handler = require('./handler.js');
const promise = require('Promise');
const client = new discord.Client();

client.on('ready', function() {
    console.log('bot initialized');
})

client.on('message', function(msg) {
    handler.handleCommand(msg);
});