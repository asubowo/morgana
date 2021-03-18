/**
 * @author Andrew Subowo
 * @since 1.0 contributory
 */

var yahooFinance = require('yahoo-finance');
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
            console.log(stock)
            let shortNames = [];
            let marketPrices = [];

            for (var i = 0; i < stock.length; i++) {
                let result = await yahooFinance.quote(stock[i], ['price']);
                
                if (result.price.shortName == undefined) {
                    shortNames.push(result.price.symbol);
                } else {
                    shortNames.push(result.price.shortName);
                }

                if (result.price.regularMarketPrice == undefined) {
                    marketPrices.push("Delayed quote or unknown stock")
                } else {
                    marketPrices.push(result.price.regularMarketPrice);    
                }  
            }

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
            console.log(err)
            console.log(err.message);
            discord.msg.channel.send(`Failed to retrieve $${stock}!`);
        }
    })();
    
}
module.exports = {
    getStonks : getStonks
}