/**
 * @author Andrew Subowo
 * @version 2.0
 * Now supports slash commands!
 */

import { SlashCommandBuilder, CommandInteraction } from 'discord.js'
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } from '@discordjs/voice';

export const data = new SlashCommandBuilder()
  .setName('audio')
  .setDescription('Play an audio SFX in a voice channel you are in')
  .addStringOption(option => option.setName('sfx')
    .setDescription('The audio sfx to play')
    .setRequired(true)
    .addChoices(
      { name: 'Ghost', value: 'ghost' }
    ));

/**
 * 
 * @param {CommandInteraction} interaction 
 * @returns 
 */
export async function execute(interaction) {
  const channel = interaction.member.voice.channelId;

  // Check if the user is in a voice channel
  if (!channel) {
    return await interaction.reply({ content: 'You must be in a voice channel to use this command', ephemeral: true });
  }

  const voiceChannel = interaction.member.voice.channelId;
  const guildId = interaction.guildId;
  const adapterCreator = interaction.guild.voiceAdapterCreator;

  //const connection = getVoiceConnection(interaction.guildId);
  const sfx = interaction.options.getString('sfx');
  
  let resource = createAudioResource('./assets/audio/' + sfx + '.mp3');

  const player = createAudioPlayer( {
      behaviors: {
        // Don't just start playing
        noSubscriber: NoSubscriberBehavior.Pause,
      },
  });

  player.play(resource);

  const connection = joinVoiceChannel({
    channelId: voiceChannel,
    guildId: guildId,
    adapterCreator: adapterCreator,
  });

  const subscription = connection.subscribe(player);

  if (subscription) {
    setTimeout(() => subscription.unsubscribe(), 5_000);
  }

  player.on('error', error => {
    logger.error(error);
  })

  // Leave the channel when finished playing the audio snippet
  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
    player.stop();
  });

  return await interaction.reply({ content: "played audio!", ephemeral: true });
}


