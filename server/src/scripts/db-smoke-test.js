const { checkDbConnection } = require('../utils/check-db-connection');

async function runDbSmokeTest() {
  const isConnected = await checkDbConnection();

  if (isConnected) {
    console.log('Sequelize smoke test: SUCCESS');
    process.exit(0);
  }

  console.error('Sequelize smoke test: FAILED');
  process.exit(1);
}

runDbSmokeTest().catch((error) => {
  console.error('Sequelize smoke test: ERROR', error.message);
  process.exit(1);
});
