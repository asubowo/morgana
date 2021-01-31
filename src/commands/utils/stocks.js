/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

const si = require('stock-info');
const Discord = require('discord.js');

var getStonks = function (discord) {
    var regex = /\$([aA-zZ])\w{0,4}\b/gim;
    var stock = discord.msg.content.match(regex);
    
    for (var index = 0; index < stock.length; index++) {
        let element = stock[index] + "";
        element = element.replace('$','');
        stock[index] = element.toUpperCase();
    }

    (async() => {
        try {
            let info = si.getStocksInfo(stock);
            
            let shortNames = [];
            let marketPrices = [];
            (await info).forEach(element => {

                if (element.shortName == undefined) {
                    shortNames.push(element.symbol);
                } else {
                    shortNames.push(element.shortName);
                }
                
                if (element.regularMarketPrice == undefined) {
                    marketPrices.push("Delayed quote or unknown stock")
                } else {
                    marketPrices.push(element.regularMarketPrice);    
                }  
            });

            const embed = new Discord.MessageEmbed()
                .setColor("RANDOM")
                .setTitle('TO THE MOON! 🚀🚀🚀')
                .setTimestamp()
                .addFields(
                    { name: 'Stock', value: shortNames, inline: true},
                    { name: 'Market Prices', value: marketPrices, inline: true},               
                );
            discord.msg.channel.send(embed);

        } catch (err) {
            console.log(err.message);
            discord.msg.channel.send(`Failed to retrieve $${stock}!`);
        }
    })();
    
}
module.exports = {
    getStonks : getStonks
}