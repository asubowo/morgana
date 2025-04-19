// Only run this as needed.
import { Routes } from 'discord.js'
import { REST } from '@discordjs/rest'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
dotenv.config({ path: '.env' })

const token  = process.env.TOKEN;
const clientID  = process.env.CLIENT_ID;


const commands = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`)
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationCommands(clientID), {body: commands})
    .then(() => logger.info('Refreshed application slash commands.'))
    .catch(logger.error);