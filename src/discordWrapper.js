/**
 * Wrapper class around an incoming Discord message
 * @author Andrew Subowo
 * @since 1.0
 */

 /**
  * Generic Command class to hold our jazz
  * @param {String} msg 
  */
function DiscordWrapper(msg) {
    var input = this.parseMessage(msg);
    if (input == undefined) {
        return;
    }

    this.msg = msg;
    this.content = content; //pass in the entire message in case we need it
    this.command = input.command;
    this.arg = input.arg;
    this.subarg = input.subarg;
    this.isCommand = input.isCommand;
    this.relinker = input.relinker;
    this.subreddit = input.subreddit;
    this.stock = input.stock;
}

/**
 * Function to parse incoming messages
 * @param {String} msg 
 */
DiscordWrapper.prototype.parseMessage = function(msg) {

    // First check if message has a subreddit, which takes priority
    if (containsSubreddit(msg)) {
        return({'subreddit' : true})
    }
    
    content = msg.content;
    let regex = /\$([A-Z])\w+/gim;
    if (content.match(regex)) {
        return({'stock' : true})
    }
  
    if (msg == '!') {
        return({'command' : undefined, 'arg' : undefined, 'isCommand' : false})
    }
    
    splitMsg = msg.content.split(' ');
    //First element is the command
    // To do -- better off to pass in the splitMsg array instead
    var command = splitMsg[0];
    var arg = splitMsg[1];
    var subarg = splitMsg[2];

    // Check if we have a valid command trigger
    if (command.toString().startsWith('!')) {
        return({'command' : command, 'arg' : arg, 'subarg' : subarg, 'isCommand' : true, 'content': content});
    } else {
        return({'command' : undefined, 'arg' : undefined, 'isCommand' : false});
    }
}

/**
 * Function to read through potential quick reddit links
 * @param {String} msg The string to parse
 */
function containsSubreddit(msg) {
    const regex = /[rR]\/[aA-zZ]*/gm;
    const subreddits = msg.content.match(regex);
    
    // Ignore if someone linked to reddit directly.
    if (msg.content.includes('http')) {
        return false;
    }
    else if (subreddits === null || subreddits.length == 0) {
        return false;
    } else {
        return true;
    }
}

module.exports = DiscordWrapper;