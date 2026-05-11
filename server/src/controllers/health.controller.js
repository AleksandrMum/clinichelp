const { success } = require('../utils/api-response');

function getHealth(req, res) {
  return success(res, { status: 'ok', service: 'clinichelp-server' });
}

module.exports = {
  getHealth
};
