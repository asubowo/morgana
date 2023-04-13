# Morgana
A Discord bot written in NodeJS to automatically dispense serotonin wherever deployed!

# Features
### OpenAI/ChatGPT integration
Morgana will talk back to you in a dedicated channel you specify.

### Subreddit relinker
This bot will automatically relink mentions of `'/r/<subreddit>'`, `'r/<subreddit>'` to reddit. It doesn't do any fancy subreddit loading or whatnot, just dropping the subreddit into a hotlink for users to click on.

### Stock tracker
Morgana will also pull up current trading prices of stocks if available. Just prefix the symbol with `$` like `$GME`

### Available Commands
#### !audio
`!audio` followed by the appropriate tag for a clip, will have the bot join the a voice channel you are in, play the sound, then leave immediately. 
#### !breakup
`!breakup` returns data from my 'Exidents Happen' website/API.
#### !help
`!help` displays a list of available commands
#### !roll
`!roll` lets you roll die. Perfect for DnD (e.g. `!roll 2d6+3`, and so on)
#### !speedtest
`!speedtest` hits the speedtest.net public API to perform a speedtest from wherever this bot (affectionately known as Morgana) is running from.
#### !uwu
`!uwu` OwO-izes the text after the command.
