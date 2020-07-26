/**
 * Class to run commands
 * @author Andrew Subowo
 * @since 1.0
 */

 /**
  * Generic Command class to hold our jazz
  * @param msg 
  */
function Command(msg) {
    var input = this.parseMessage(msg);
    if (input == undefined) {
        return;
    }

    this.msg = msg;
    this.command = input.command;
    this.arg = input.arg;
    this.isCommand = input.isCommand;
    this.relinker = input.relinker;
    this.subreddit = input.subreddit;
}

// Bot commands must start with '!'
Command.prototype.parseMessage = function(msg) {

    // First check if message has a subreddit, which takes priority
    if (containsSubreddit(msg)) {
        return({'subreddit' : true})
    }
    splitMsg = msg.content.split(' ');
    //First element is the command
    var command = splitMsg[0];
    var arg = splitMsg[1];

    // Check if we have a valid command trigger
    if (command.toString().startsWith('!')) {
        return({'command' : command, 'arg' : arg, 'isCommand' : true});
    } else {
        return({'command' : undefined, 'arg' : undefined, 'isCommand' : false});
    }
}

/**
 * Function to read through potential quick reddit links
 * @param msg 
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

module.exports = Command;