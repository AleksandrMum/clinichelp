const { sequelize } = require('../../db/models');

async function checkDbConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    return false;
  }
}

module.exports = {
  checkDbConnection
};
