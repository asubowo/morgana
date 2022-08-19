/**
 * @author Andrew Subowo
 * @version 2.0
 * Now supports slash commands!
 */


const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a set of virtual dice you specify')
    .addStringOption(option => option.setName('roll')
      .setDescription('Dice roll syntax: d20, 3d10+1')
      .setRequired(true)),
  async execute(interaction) {
    
    // Get the dice roll syntax
    const content = interaction.options.getString('roll');
    const user = interaction.user.username;
    
    // Make sure people aren't doing anything funky with the roll modifier
    if (content.includes('+') && content.includes('-')) {
      return interaction.reply({ content: 'Please only subtract or add your modifier, not both!', ephemeral: true});
    }

    let modifier;
    let subtraction = false;
    if (content.includes('+') || content.includes('-')) {
      if (content.includes('-')) {
        subtraction = true;
      }

      let modifierInput = content.split(/[+-]/);
      if (modifierInput[1] === "") {
        return interaction.reply({ content: 'Please include a number next to the modifier!', emphemeral: true });
      } else {
        modifier = parseInt(modifierInput[1]);
        if (subtraction) {
          modifier = modifier * -1;
        }
        if (!Number.isInteger(modifier) || Math.abs(modifier) > 100) {
          return interaction.reply({ content: 'You\'ve given me an invalid die modifier!', emphemeral: true });
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
      if (!Number.isInteger(multiplier) || multiplier > 100 || multiplier <= 0) {
        return interaction.reply({ content: "I can't roll " + diceRoll[0] + " dice!", emphemeral: true });
      }
    }

    // Get the type of die the user is rolling
    let diceType = diceRoll[1];
    if (diceType === "") {
      return interaction.reply({ content: 'You must specify a dice type!', emphemeral: true });
    } else {
      diceType = parseInt(diceRoll[1]);
      if (!Number.isInteger(diceType) || diceType === 0 || diceType > 100 || diceType <= 0) {
        return interaction.reply({ content: "STOP! You have violated the law. Your invalid die are now forfeit.", emphemeral: true });
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
    let highestPotential = multiplier * diceType + modifier;
    let ratio = result / highestPotential;

    let flavorText = "";
    if (ratio >= 1) {
      let phrases = ["GLORIOUS SUCCESS", "ULIMITED POWER", "YOU ARE THE DUNGEON MASTER NOW"];
      flavorText = phrases[Math.floor(Math.random() * phrases.length)];
    } else if (ratio < 1 && ratio >= 0.75) {
      let phrases = ["Solid roll!", "Nicely done!", "Nice!", "A decent roll!"];
      flavorText = phrases[Math.floor(Math.random() * phrases.length)];
    } else if (ratio < 0.75 && ratio >= 0.50) {
      let phrases = ["Not too bad!", "You're quite the average person!", "Eh.", "You could've done worse.", "I suppose it's a decent roll."];
      flavorText = phrases[Math.floor(Math.random() * phrases.length)];
    } else {
      let phrases = ["Oof...", "Could be better...", "Better luck next time...", "Are you even trying?", "Just stop rolling.", "You should stick to card games."];
      flavorText = phrases[Math.floor(Math.random() * phrases.length)];
    }

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

    // Build an embed containing the information about the roll and results
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle("You rolled a " + result + "! " + flavorText)
      .setDescription("(" + rollHolder.join(" + ") + modifierString + ")")
      .setFooter({ text: user + " rolled a " + content });

    return interaction.reply({ embeds: [embed] });
  }
}

/**
* @param {Integer} max The highest we can roll
*/
function getRandomInt(max) {
  return Math.floor(Math.random() * (max)) + 1;
}
