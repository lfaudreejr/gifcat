//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the gifcat bot.

// Import Botkit's core features
const {
  Botkit
} = require('botkit');
const {
  BotkitCMSHelper
} = require('botkit-plugin-cms');

// Import a platform-specific adapter for slack.

const {
  SlackAdapter,
  SlackMessageTypeMiddleware,
  SlackEventMiddleware
} = require('botbuilder-adapter-slack');

const {
  MongoDbStorage
} = require('botbuilder-storage-mongodb');

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
  storage = mongoStorage = new MongoDbStorage({
    url: process.env.MONGO_URI,
    database: 'gifcat'
  });
}



const adapter = new SlackAdapter({
  // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
  // enable_incomplete: true,

  // parameters used to secure webhook endpoint
  verificationToken: process.env.verificationToken,
  clientSigningSecret: process.env.clientSigningSecret,

  // auth token for a single-team app
  botToken: process.env.botToken,

  // credentials used to set up oauth for multi-team apps
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  scopes: ['bot'],
  redirectUri: process.env.redirectUri,

  // functions required for retrieving team-specific info
  // for use in multi-team apps
  getTokenForTeam: getTokenForTeam,
  getBotUserByTeam: getBotUserByTeam,
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());


const controller = new Botkit({
  webhook_uri: '/api/messages',

  adapter: adapter,

  storage
});

if (process.env.cms_uri) {
  controller.usePlugin(new BotkitCMSHelper({
    uri: process.env.cms_uri,
    token: process.env.cms_token,
  }));
}

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

  // load traditional developer-created local custom feature modules
  controller.loadModules(__dirname + '/features');

  /* catch-all that uses the CMS to trigger dialogs */
  if (controller.plugins.cms) {
    controller.on('message,direct_message', async (bot, message) => {
      let results = false;
      results = await controller.plugins.cms.testTrigger(bot, message);

      if (results !== false) {
        // do not continue middleware!
        return false;
      }
    });
  }

});

controller.webserver.get('/', (req, res) => {

  res.send(`This app is running Botkit ${ controller.version }.`);

});

controller.webserver.get('/install', (req, res) => {
  // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
  res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
  try {
    const results = await controller.adapter.validateOauthCode(req.query.code);

    console.log('FULL OAUTH DETAILS', results);

    storage.write({
      [results.team_id]: {
        bot_access_token: results.bot.bot_access_token,
        bot_user_id: results.bot.bot_user_id,
      },
    })

    res.json('Success! Bot installed.');

  } catch (err) {
    console.error('OAUTH ERROR:', err);
    res.status(401);
    res.send(err.message);
  }
});

async function getTokenForTeam(teamId) {
  console.log('getTokenForTeam teamId', teamId)
  const team = await storage.read([teamId]);
  console.log('getTokenForTeam TEAM: ', team)
  if (team && team.bot_access_token) {
    return team.bot_access_token
  } else {
    console.error('Team not found in tokenCache: ', teamId);
  }
}

async function getBotUserByTeam(teamId) {
  console.log('getBotUserByTeam teamId', teamId)
  const team = await storage.read([teamId]);
  console.log('getBotUserByTeam TEAM: ', team)
  if (team && team.bot_user_id) {
    return team.bot_user_id
  } else {
    console.error('Team not found in userCache: ', teamId);
  }
}