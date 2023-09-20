const path = require('path');
const { google } = require('googleapis');

const KEY_PATH = path.join(process.cwd(), 'src/config/google.json');
const keys = require(KEY_PATH);

const SCOPES = [
  'email',
  'profile',
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels',
];

const oAuth2Client = new google.auth.OAuth2(keys.web.client_id, keys.web.client_secret, 'postmessage');

async function getAccessToken(code) {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

function getGoogleAuth(refreshToken) {
  const auth = new google.auth.OAuth2(keys.web.client_id, keys.web.client_secret, 'postmessage');
  auth.setCredentials({
    scope: SCOPES.join(' '),
    refresh_token: refreshToken,
  });
  return auth;
}

async function getUserInfo(refreshToken) {
  const auth = getGoogleAuth(refreshToken);
  return await google.oauth2({ auth, version: 'v2' }).userinfo.get();
}

module.exports = {
  getAccessToken,
  oAuth2Client,
  getUserInfo,
  getGoogleAuth,
};
