/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

/**
 * @param msg Discord the Discord entity returned
 */
var uwuinate = function (discord) {
    var content = discord.msg.content;
    content = content.substr(content.indexOf(' ') + 1);
   
    var smilies = ['^w^', '>w<', '(・`ω・)', '(´・ω・)', '(◡ ω ◡)', '(◕ ꒳ ◕)'];

    content = content.replace(/you/ig, 'uwu');
    content = content.replace(/L/g, 'W').replace(/l/g, 'w').replace(/R/g, 'W').replace(/r/g, 'w');

    content = content.replace(/\!/g, '! ' + smilies[Math.floor(Math.random() * smilies.length)]);
    content = content.concat(' ', 'UwU');
    
    discord.msg.channel.send(content);
}

module.exports = {
    uwuinate : uwuinate
}