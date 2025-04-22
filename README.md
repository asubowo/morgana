[![Production release status](https://github.com/asubowo/morgana/actions/workflows/prod.workflow.yml/badge.svg?branch=master)](https://github.com/asubowo/morgana/actions/workflows/prod.workflow.yml)
# Morgana
A Discord bot written in NodeJS to automatically dispense serotonin wherever deployed!
Morgana has been my personal 'pet' project working and initially learning NodeJS, then eventually branching out into learning TypeScript and running my own API server with MCP capabilities (different repo)

YOU WILL SEE INCONSISTENCIES IN CODE QUALITY AND STANDARDS!!! Morgana is a product of me starting with node when COVID was a thing. I've learned a few things and moved from CJS to ESM.

# Features
### OpenAI/ChatGPT integration
Morgana will talk back to you in a dedicated channel you specify, otherwise he'll respond in any channel where you mention him.

### Subreddit relinker
Morgana will automatically relink mentions of `'/r/<subreddit>'`, `'r/<subreddit>'` to reddit. It doesn't do any fancy subreddit loading or whatnot, just dropping the subreddit into a hotlink for users to click on.

### Stock tracker
Morgana will also pull up current trading prices of stocks if available. Just prefix the symbol with `$` like `$GME`. If there's an MCP server detected, Morgana will additionally pull information from there as well.

### Available Commands
#### /audio
/audio followed by the appropriate tag for a clip, will have the bot join the a voice channel you are in, play the sound, then leave immediately. 
#### /roll
Lets you roll dice in common DnD syntax. Perfect for DnD (e.g. `!roll 2d6+3`, and so on)
#### /metro status
Gets the current metro status updates from WMATA
#### /metro station <station name>
Gets the given station status and trains
