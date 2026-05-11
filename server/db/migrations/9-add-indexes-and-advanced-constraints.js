'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('users', ['role', 'is_active'], {
      name: 'users_role_is_active_idx'
    });

    await queryInterface.addIndex('patients', ['full_name'], {
      name: 'patients_full_name_idx'
    });
    await queryInterface.addIndex('patients', ['phone'], {
      name: 'patients_phone_idx'
    });
    await queryInterface.addIndex('patients', ['is_archived'], {
      name: 'patients_is_archived_idx'
    });

    await queryInterface.addIndex('services', ['is_available'], {
      name: 'services_is_available_idx'
    });
    await queryInterface.addIndex('services', ['name'], {
      name: 'services_active_name_unique_idx',
      unique: true,
      where: {
        is_available: true
      }
    });

    await queryInterface.addIndex('schedule_rules', ['doctor_id', 'weekday', 'is_archived'], {
      name: 'schedule_rules_doctor_weekday_archived_idx'
    });
    await queryInterface.addIndex('schedule_exceptions', ['doctor_id', 'start_at', 'end_at', 'is_archived'], {
      name: 'schedule_exceptions_doctor_time_archived_idx'
    });

    await queryInterface.addIndex('appointments', ['doctor_id', 'start_at'], {
      name: 'appointments_doctor_start_idx'
    });
    await queryInterface.addIndex('appointments', ['doctor_id', 'status', 'start_at'], {
      name: 'appointments_doctor_status_start_idx'
    });
    await queryInterface.addIndex('appointments', ['patient_id', 'start_at'], {
      name: 'appointments_patient_start_idx'
    });
    await queryInterface.addIndex('appointments', ['status', 'start_at'], {
      name: 'appointments_status_start_idx'
    });

    await queryInterface.addIndex('audit_log', ['user_id', 'action_time'], {
      name: 'audit_log_user_action_time_idx'
    });
    await queryInterface.addIndex('audit_log', ['entity_type', 'entity_id', 'action_time'], {
      name: 'audit_log_entity_action_time_idx'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_doctor_time_no_overlap_excl"
      EXCLUDE USING gist (
        "doctor_id" WITH =,
        tstzrange("start_at", "end_at", '[)') WITH &&
      )
      WHERE ("status" <> 'cancelled');
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_doctor_time_no_overlap_excl";'
    );

    await queryInterface.removeIndex('audit_log', 'audit_log_entity_action_time_idx');
    await queryInterface.removeIndex('audit_log', 'audit_log_user_action_time_idx');

    await queryInterface.removeIndex('appointments', 'appointments_status_start_idx');
    await queryInterface.removeIndex('appointments', 'appointments_patient_start_idx');
    await queryInterface.removeIndex('appointments', 'appointments_doctor_status_start_idx');
    await queryInterface.removeIndex('appointments', 'appointments_doctor_start_idx');

    await queryInterface.removeIndex('schedule_exceptions', 'schedule_exceptions_doctor_time_archived_idx');
    await queryInterface.removeIndex('schedule_rules', 'schedule_rules_doctor_weekday_archived_idx');

    await queryInterface.removeIndex('services', 'services_is_available_idx');
    await queryInterface.removeIndex('services', 'services_active_name_unique_idx');

    await queryInterface.removeIndex('patients', 'patients_is_archived_idx');
    await queryInterface.removeIndex('patients', 'patients_phone_idx');
    await queryInterface.removeIndex('patients', 'patients_full_name_idx');

    await queryInterface.removeIndex('users', 'users_role_is_active_idx');
  }
};
