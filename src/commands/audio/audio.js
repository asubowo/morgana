/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

/**
 * Plays the selected audio file into your current voice channel..
 * @param command the command called by the bot summoner.
 */
var audio = function(command) {

  if (command.arg == undefined) {
    command.msg.reply("you must include a category and an audio file. Try !help audio.");
    return;
  }

  if (command.arg == 'ghost') {
    playAudio('ghost.mp3', command);
  }
}
/**
 * Play a specific sound clip as passed in by the audio function.
 * @param audio string/char set audio String of audio clip
 * @param command the command called by the bot summoner.
 */
function playAudio(audio, command) {
  var voiceChannel = command.msg.member.voice.channel;
  try {
    voiceChannel.join().then(function(connection) {
      const dispatcher = connection.play('../assets/audio/' + audio);
      dispatcher.on('finish', () => {
        console.log('done playing file');
        voiceChannel.leave();
      });
    }).catch(function(err) {
      console.log('Cannot play audio file');
      console.log(err);
    });
  }
  catch (err) {
    command.msg.reply('you need to be in a voice channel.');
  }
  return;
}

module.exports = {
  audio : audio
}