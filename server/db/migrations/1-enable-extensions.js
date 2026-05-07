'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS btree_gist;');
  },

  async down(queryInterface) {
    // Intentionally no-op: dropping shared extensions can break other schemas/objects.
    return Promise.resolve();
  }
};
