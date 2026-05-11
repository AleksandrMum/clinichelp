'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../../db/models');

const DEFAULT_LOGIN = process.env.FIRST_ADMIN_LOGIN || 'admin';
const DEFAULT_PASSWORD = process.env.FIRST_ADMIN_PASSWORD || 'admin12345';
const DEFAULT_FULL_NAME = process.env.FIRST_ADMIN_FULL_NAME || 'System Administrator';
const DEFAULT_PHONE = process.env.FIRST_ADMIN_PHONE || null;
const PASSWORD_SALT_ROUNDS = 10;

async function run() {
  const login = String(DEFAULT_LOGIN).trim();
  const password = String(DEFAULT_PASSWORD);
  const fullName = String(DEFAULT_FULL_NAME).trim();

  if (!login || !password || !fullName) {
    throw new Error('FIRST_ADMIN_LOGIN, FIRST_ADMIN_PASSWORD and FIRST_ADMIN_FULL_NAME are required');
  }

  const existing = await User.findOne({ where: { login } });
  if (existing) {
    console.log(`[create-first-admin] User with login "${login}" already exists. Skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const created = await sequelize.transaction(async (transaction) => {
    return User.create(
      {
        full_name: fullName,
        login,
        password_hash: passwordHash,
        role: 'admin',
        phone: DEFAULT_PHONE,
        is_active: true,
        deactivated_at: null
      },
      { transaction }
    );
  });

  console.log(`[create-first-admin] Admin created. id=${created.id} login=${created.login}`);
}

run()
  .catch((error) => {
    console.error('[create-first-admin] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
