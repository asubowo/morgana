/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */


const Discord = require('discord.js');
const DiscordWrapper = require('../../discordWrapper');

/**
 * Returns the help page of Morgana
 * @param {DiscordWrapper} discord 
 */
var getHelp = function (discord) {
    let title = "";
    let description = "";
    switch (discord.arg) {
        default:
            title = "Command list:";
            description = "!audio, !breakup, !roll, !uwu\n\nTry !help <command name> (!help roll) for more information about that particular command.";
            sendEmbed(title, description, discord);
            break;
        case 'audio':
            title = "!audio";
            description = "Use !audio <clip> to have me join the voice channel you are in, play the sound clip, then leave immediately. The following arguments are supported:\n\n" +
                "- ghost";
            sendEmbed(title, description, discord);
            break;
        case 'breakup':
            title = "!breakup";
            description = "Gets the total amount of tweets about breakups from the beginning of the current month.";
            sendEmbed(title, description, discord);
            break;
        case 'roll':
            title = "!roll";
            description = "It's a DnD dice roller! Can roll a maximum of 100, 100-sided die. E.g. '!roll 22d20'";
            sendEmbed(title, description, discord);
            break;
    }
}

/**
 * Function to send the embedded jazz
 * @param {String} title 
 * @param {String} description 
 * @param {DiscordWrapper} discord
 */
function sendEmbed(title, description, discord) {
    const embed = new Discord.MessageEmbed()
    .setColor('#34eb64')
    .setTitle(title)
    .setDescription(description);
    discord.msg.channel.send(embed);
}

module.exports = {
    getHelp : getHelp
}