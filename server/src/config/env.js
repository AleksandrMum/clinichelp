const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-change-me-in-env',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'clinichelp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: process.env.DB_DIALECT || 'postgres'
  }
};
