const axios = require('axios');
const {
  setIntervalAsync,
  clearIntervalAsync
} = require('set-interval-async/dynamic');

module.exports = function (controller) {

  let LISTENERS = {};
  let TIME = 15;
  let CATS = [];

  controller.on('direct_mention', async (bot, message) => {
    console.log('a direct mention has been heard - ', message.text)
    console.log('bot is - ', bot)
    console.log('message is - ', message)
    if (message.text === 'meow') {
      console.log('Got start - meow!!')
      await getCats(message);
      await setListener(message)
    }
    if (message.text === 'stop') {
      clearIntervalAsync(LISTENERS[message.channel])
      LISTENERS[message.channel] = undefined
      await bot.say('Stopped.')
    }
    if (message.text.includes('set interval')) {
      const incoming = message.text.split(' ')
      
      if (incoming[0] === 'set' && incoming[1] === 'interval' && !isNaN(Number(incoming[2]))) {
        TIME = Number(incoming[2])
        if (LISTENERS[message.channel]) {
          await setListener(message)
        }
        await bot.say('Your new interval has been set to ' + TIME + ' minutes.')
      } else {
        await bot.say('Sorry, I could not understand you.')
      }
      
    }
    if (message.text === 'help') {
      await bot.say('Use @gifcat start to start receiving gifs.')
    }
  });
  
  async function setListener (message) {
    if (LISTENERS[message.channel]) {
      clearIntervalAsync(LISTENERS[message.channel])
      LISTENERS[message.channel] = undefined
    }
    LISTENERS[message.channel] = await setIntervalAsync(getCats, 60000 * TIME, message);
  }

  async function getCats(message) {
    const bot = await controller.spawn({
      activity: {
        conversation: {
          team: message.team,
        },
     },
    })

    await bot.startConversationInChannel(message.channel, message.user);

    try {
      if (CATS.length === 0) {
        // const { data } = await axios.get(`https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_KEY}&q=cat&rating=G&lang=en`);
        // CATS = data.data;
        // TODO:
        // store offset
        // limit is 25 per pull
        // subtract 25 from length total to get # offsets
        // use random number 0 - offset total for offset when getting more gifs
        // OR use giphy random endpoint on each call
      }
      const { data } = await axios.get(`https://api.giphy.com/v1/gifs/random?api_key=${process.env.GIPHY_KEY}&tag=cat&rating=G&lang=en`)
  
      // const gif = CATS.pop();
      const { gif: data } = data

      console.log('got cat gif: ', gif)

      await bot.say(`https://media.giphy.com/media/${gif.id}/giphy.gif`)

    } catch (error) {
      console.error('[ERROR] ', error);
      await bot.say('Sorry, I am not working well right now.')
    }
  }
  
}