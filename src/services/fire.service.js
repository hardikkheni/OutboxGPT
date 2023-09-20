const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const account = require('../config/firebase.json');

const fireApp = admin.initializeApp({
  credential: admin.credential.cert(account),
});

async function verify(idToken) {
  const data = await getAuth(fireApp).verifyIdToken(idToken);
  const firebaseUser = await getAuth(fireApp).getUser(data.uid);
  return firebaseUser.providerData[0];
}

module.exports = {
  verify,
};
