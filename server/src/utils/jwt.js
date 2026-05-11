const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { role: user.role, login: user.login },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn,
      issuer: 'clinichelp',
      subject: String(user.id)
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret, {
    issuer: 'clinichelp'
  });
}

module.exports = {
  signAccessToken,
  verifyAccessToken
};
