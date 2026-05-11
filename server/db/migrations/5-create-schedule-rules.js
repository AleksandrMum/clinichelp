'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedule_rules', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true
      },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      weekday: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      is_archived: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      archived_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addConstraint('schedule_rules', {
      fields: ['weekday'],
      type: 'check',
      where: {
        weekday: {
          [Sequelize.Op.between]: [1, 7]
        }
      },
      name: 'schedule_rules_weekday_range_check'
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "schedule_rules" ADD CONSTRAINT "schedule_rules_time_order_check" CHECK ("end_time" > "start_time");'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('schedule_rules');
  }
};
