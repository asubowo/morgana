/**
 * @author Andrew Subowo
 * @version 2.0
 * Doesn't support slash commands BUT updated with better Andrew knowledge of NodeJS!
 */

import { EmbedBuilder, Message } from 'discord.js'
import yahooFinance from 'yahoo-finance2';
import { logger } from '../../utils/logger.js'
/**
 * 
 * @param {Message} messageContext 
 */
export function getStonks(messageContext) {
    var regex = /\$([A-Z])\w{0,4}\b/gim;
    var stock = messageContext.content.match(regex);
    console.debug("Detected stocks in message:", stock)

    for (var index = 0; index < stock.length; index++) {
        let element = stock[index] + "";
        element = element.replace('$','');
        stock[index] = element.toUpperCase();
    }

    (async() => {
        try {
            const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('TO THE MOON! 🚀🚀🚀')
            .setTimestamp()
            .addFields( { name: 'Stock', value:'\u200b', inline: true }, { name: 'Market Prices', value:'\u200b', inline: true }, { name: '\u200b', value: '\u200b', inline: true } );

            let shortNames = [];
            let marketPrices = [];

            for (var i = 0; i < stock.length; i++) {
                console.debug("Attempting to retrieve quote for", stock[i])
                const quote = await yahooFinance.quote(stock[i]);
                const { regularMarketPrice, shortName, symbol, regularMarketChangePercent } = quote;
                
                if ( shortName == undefined ) {
                    shortNames = [...shortNames, symbol];
                } else {
                    shortNames = [...shortNames, shortName];
                }

                if ( regularMarketPrice == undefined) {
                    marketPrices = [...marketPrices, 'Delayed quote or unknown stock'];
                } else {
                    marketPrices = [...marketPrices, regularMarketPrice];
                }  

                embed.addFields(
                    { name: shortNames[i].toString(), value: symbol, inline: true},
                    { name: "$" + marketPrices[i].toString(), value: percentRound(regularMarketChangePercent).toString() + '%', inline: true},  
                    { name: '\u200b', value: '\u200b', inline: true } 
                    // Forced empty entry to make formatting the embed a bit better. Not the best, but since they're forcing string values, it is what it is
                );
            }
            return await messageContext.channel.send( { embeds: [ embed ]});

        } catch (err) {
            logger.info(err);
            logger.info(err.message);
            return
        }
    })();
}

/**
 * 
 * @param {float} num The number to be rounded
 * @returns A float fixed to 2 decimal places
 */
function percentRound(num) {
    return Number.parseFloat(num).toFixed(2);
}
