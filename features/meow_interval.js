const axios = require('axios');
const {
  setIntervalAsync,
  clearIntervalAsync
} = require('set-interval-async/dynamic');

module.exports = function (controller) {

  let LISTENERS = {};
  let LISTENER;
  let TIME = 1;
  let CATS = [];

  controller.on('direct_mention', async (bot, message) => {
    console.log('a direct mention has been heard - ', message.text)
    console.log('bot is - ', bot)
    console.log('message is - ', message)
    if (message.text === 'meow') {
      console.log('Got start - meow!!')
      // LISTENERS[bot.user] = await setIntervalAsync(getCats, 5000, message);
      await getCats(message);
      await setListener(message)
      // LISTENER = await setIntervalAsync(getCats, 5000, message);
    }
    if (message.text === 'stop') {
      // clearIntervalAsync(LISTENERS[bot.user]);
      // clearIntervalAsync(LISTENER)
      // LISTENER = undefined
      clearIntervalAsync(LISTENERS[message.channel])
      LISTENERS[message.channel] = undefined
      await bot.say('Stopped.')
    }
    if (message.text.includes('set interval')) {
      const incoming = message.text.split(' ')
      
      if (incoming[0] === 'set' && incoming[1] === 'interval' && !isNaN(Number(incoming[2]))) {
        TIME = Number(incoming[2])
        // if (LISTENER) {
        //   await setListener(message)
        // }
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
    // if (LISTENER) {
    //   clearIntervalAsync(LISTENER)
    //   LISTENER = undefined
    // }
    // LISTENER = await setIntervalAsync(getCats, 60000 * TIME, message);
  }

  async function getCats(message) {
    const bot = await controller.spawn({
      // incoming_webhook: {
      //   url: 'https://hooks.slack.com/services/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'
      // },
      activity: {
        conversation: {
          team: message.team,
        },
     },
    })
    // bot.changeContext(message.reference)
    await bot.startConversationInChannel(message.channel, message.user);

    try {
      if (CATS.length === 0) {
        const { data } = await axios.get(`https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_KEY}&q=cat&rating=G&lang=en`);
        CATS = data.data;
      }
  
      const gif = CATS.pop();
  
      // await bot.say({
      //   text: `https://media.giphy.com/media/${gif.id}/giphy.gif`,
      //   channel: message.channel
      // });
      await bot.say(`https://media.giphy.com/media/${gif.id}/giphy.gif`)

    } catch (error) {
      console.error('[ERROR] ', error);
      // await bot.say({
      //   text: 'Sorry, I am not working well right now.',
      //   channel: message.channel
      // });
      await bot.say('Sorry, I am not working well right now.')
    }
  }
  
}