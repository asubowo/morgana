/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

/**
 * @param msg Discord the Discord entity returned
 */
const Discord = require('discord.js');
var roll = function (discord) {

    //Get the content after !roll command, and sanitize it all from spaces
    let content = discord.msg.content;
    content = content.substr(content.indexOf(' ') + 1).replace(/\s/g, '');

    if (content === "!roll") {
        discord.msg.channel.send("usage example: '!roll d20, !roll 3d20+1, !roll 2d20, !roll 1d100', etc.");
        return;
    }

    if (content.includes('+') && content.includes('-')) {
        discord.msg.reply("please include only subtract or add your modifier, not both!");
        return;
    }

    let modifier;
    let subtraction = false;
    if (content.includes('+') || content.includes('-')) {
        if (content.includes('-')) {
            subtraction = true;
        }

        let modifierInput = content.split(/[+-]/);
        if (modifierInput[1] === "") {
            discord.msg.reply("please include a number next to the modifier!")
            return;
        } else {

            modifier = parseInt(modifierInput[1]);
            if (subtraction) {
                modifier = modifier * -1;
            }
            if (!Number.isInteger(modifier)) {
                discord.msg.reply("you've given me an invalid die modifier.");
                return;
            }
        }
    } else {
        modifier = 0;
    }    
    
    // Get the dice roll syntax from the user, and see if they're rolling multiple die
    let diceRoll = content.split(/[dD]/);
    let multiplier = diceRoll[0];
    if (diceRoll[0] === "") {
        multiplier = 1;
    } else {
        multiplier = parseInt(diceRoll[0]);
        if (!Number.isInteger(multiplier)) {
            discord.msg.reply("I can't roll " + diceRoll[0] + " dice!");
            return;
        }
    }

    // Get the type of die the user is rolling
    let diceType = diceRoll[1];
    if (diceType === "") {
        discord.msg.reply("you must specify a dice type!");
        return;
    } else {
        diceType = parseInt(diceRoll[1]);
        if (diceType === 0 || !Number.isInteger(diceType)) {
            discord.msg.reply("STOP! You have violated the law. Your invalid die are now forfeit.");
            return;
        } 
    }
    
    let rollHolder = [];
    let rollTotal = 0;
    for (rolls = 0; rolls < multiplier; rolls++) {
        let roll = getRandomInt(diceType);
        rollHolder.push(roll);
        rollTotal = rollTotal + roll;
    }

    let result = rollTotal + modifier;

    // Check if the user passed in a modifier, and if we did, dynamically update the string
    let modifierString = "";
    if (modifier === 0) {
        modifierString = ""
    } else {
        if (subtraction) {
            // Flip the modifier back around to it presents correctly
            modifierString = " - " + modifier * -1;
        } else {
            modifierString = " + " + modifier;
        }
    }

    const embed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle("You rolled a " + result + "! ")
    .setDescription("(" + rollHolder.join(" + ") + modifierString + ")");
    discord.msg.channel.send(embed);
}

/**
 * 
 * @param {integer} max The highest we can roll
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * (max)) + 1;
}

module.exports = {
    roll : roll
}