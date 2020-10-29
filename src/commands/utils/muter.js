/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

/**
 * Plays the selected audio clip into a voice channel the summoner is in.
 * Was SUPPOSED to be used for Among Us, but is left alone as a command stub/template for now.
 * @param {DiscordWrapper} discord The wrapper instanced called by the bot summoner
 */
var mute = function (discord) {
    let voiceChannel = discord.msg.member.voice.channel;
    // try {
    //     for (const [memberID, member] of voiceChannel.members) {
            
    //         member.voice.setMute(true);
    //     }
    // }
    // catch (err) {
    //     console.log(err);
    //     discord.msg.reply('you need to be in a voice channel for this command.');
    // }

    return;
}


module.exports = {
    mute: mute
}