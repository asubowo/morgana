// Only run this as needed.
const { Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const token  = process.env.TOKEN;
const clientID  = process.env.CLIENT_ID;


const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationCommands(clientID), {body: commands})
    .then(() => console.log('Refreshed application slash commands.'))
    .catch(console.error);