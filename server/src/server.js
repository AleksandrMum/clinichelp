const app = require('./app');
const env = require('./config/env');
const { checkDbConnection } = require('./utils/check-db-connection');

async function startServer() {
  await checkDbConnection();

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
}

startServer();
