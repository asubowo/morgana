/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

/**
 * Plays the selected audio clip into a voice channel the summoner is in.
 * @param {DiscordWrapper} discord The wrapper instanced called by the bot summoner
 */
var audio = function(discord) {

  if (discord.arg == undefined) {
    discord.msg.reply("you must include a category and an audio file. Try !help audio.");
    return;
  }

  if (discord.arg == 'ghost') {
    playAudio('ghost.mp3', discord);
  }
}
/**
 * Play a specific sound clip as passed in by the audio function.
 * @param {String} audio string/char set audio String of audio clip
 * @param {DiscordWrapper} discord the DiscordWrapper instance called by the bot summoner.
 */
function playAudio(audio, discord) {
  var voiceChannel = discord.msg.member.voice.channel;
  try {
    voiceChannel.join().then(function(connection) {
      const dispatcher = connection.play('../assets/audio/' + audio);
      dispatcher.on('finish', () => {
        voiceChannel.leave();
      });
    }).catch(function(err) {
      console.log('Cannot play audio file');
      console.log(err);
    });
  }
  catch (err) {
    discord.msg.reply('you need to be in a voice channel.');
  }
  return;
}

module.exports = {
  audio : audio
}