const { LogLevel, ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const axios = require('axios');
const FormData = require('form-data');
require('isomorphic-fetch');

const scopes = ['openid', 'profile', 'offline_access', 'User.Read', 'Mail.Read', 'email', 'Mail.ReadBasic', 'Mail.ReadWrite', 'Mail.Send'];

const redirectUri = `${process.env.SERVER_URL}/api/v1/account/ms/varify-code`;
const authority = `https://login.microsoftonline.com/common`;

const config = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID,
    authority,
    clientSecret: process.env.MSAL_CLIENT_SECRET,
  },
  scopes,
  // TODO: Add cache plugin
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (!containsPii) console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose,
    },
  },
};

const cca = new ConfidentialClientApplication(config);

async function getAuthLink() {
  return await cca.getAuthCodeUrl({
    scopes,
    redirectUri,
    extraQueryParameters: {
      prompt: 'select_account',
    },
  });
}

async function acquireTokenByCode(options) {
  const form = new FormData();
  form.append('client_id', process.env.MSAL_CLIENT_ID);
  form.append('scope', scopes.join(' '));
  form.append('code', options.code);
  form.append('redirect_uri', `${process.env.SERVER_URL}/api/v1/account/ms/varify-code`);
  form.append('grant_type', 'authorization_code');
  form.append('client_secret', process.env.MSAL_CLIENT_SECRET);

  const res = await axios.post(`${authority}/oauth2/v2.0/token`, form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
  });
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
  };
}

function getGraphClient({ refreshToken, homeAccountId = null }) {
  const client = Client.init({
    authProvider: async (done) => {
      let accountInfo;
      const accounts = await cca.getTokenCache().getAllAccounts();
      if (homeAccountId) {
        accountInfo = accounts.find((acc) => acc.homeAccountId === homeAccountId);
      }
      if (accountInfo) {
        try {
          const res = await cca.acquireTokenSilent({
            account: accountInfo,
            scopes,
            forceRefresh: true,
          });
          if (res) {
            done(null, res.accessToken);
            return;
          }
        } catch (err) {}
      }
      try {
        const result = await cca.acquireTokenByRefreshToken({
          refreshToken: refreshToken,
          account: accountInfo,
          scopes,
          forceRefresh: true,
        });
        done(null, result.accessToken);
      } catch (err) {
        done(err, null);
      }
    },
  });
  return client;
}

async function me(options) {
  const res = await cca.acquireTokenByRefreshToken({
    refreshToken: options.refreshToken,
    scopes,
    forceRefresh: true,
  });
  const client = getGraphClient({ ...options, homeAccountId: res.account.homeAccountId });
  const me = await client.api('/me').select('displayName,mail,userPrincipalName').get();
  return {
    ...me,
    homeAccountId: res.account.homeAccountId,
  };
}

function createDraft(options, email) {
  const client = getGraphClient(options);
  return client.api('/me/messages').post(email);
}
function findByInternetMessageId(options, interetMessageId) {
  const client = getGraphClient(options);
  return client
    .api('/me/messages')
    .filter(`internetMessageId eq '${encodeURIComponent(interetMessageId)}'`)
    .get();
}

module.exports = {
  getGraphClient,
  getAuthLink,
  acquireTokenByCode,
  me,
  draft: {
    create: createDraft,
  },
  messages: {
    findByInternetMessageId,
  },
};
