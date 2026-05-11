require('dotenv').config();

const baseConfig = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'clinichelp',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5432,
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: false
};

module.exports = {
  development: baseConfig,
  test: baseConfig,
  production: baseConfig
};
