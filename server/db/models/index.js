const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging
});

const db = {};
const basename = path.basename(__filename);

fs.readdirSync(__dirname)
  .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
  .forEach((file) => {
    const modelFactory = require(path.join(__dirname, file));
    const model = modelFactory(sequelize, DataTypes);
    db[model.name] = model;
  });

const {
  User,
  Patient,
  Service,
  ScheduleRule,
  ScheduleException,
  Appointment,
  AuditLog
} = db;

if (User && ScheduleRule) {
  User.hasMany(ScheduleRule, {
    foreignKey: 'doctor_id',
    as: 'scheduleRules',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  ScheduleRule.belongsTo(User, {
    foreignKey: 'doctor_id',
    as: 'doctor',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
}

if (User && ScheduleException) {
  User.hasMany(ScheduleException, {
    foreignKey: 'doctor_id',
    as: 'scheduleExceptions',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  ScheduleException.belongsTo(User, {
    foreignKey: 'doctor_id',
    as: 'doctor',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
}

if (Patient && Appointment) {
  Patient.hasMany(Appointment, {
    foreignKey: 'patient_id',
    as: 'appointments',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  Appointment.belongsTo(Patient, {
    foreignKey: 'patient_id',
    as: 'patient',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
}

if (User && Appointment) {
  User.hasMany(Appointment, {
    foreignKey: 'doctor_id',
    as: 'doctorAppointments',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  Appointment.belongsTo(User, {
    foreignKey: 'doctor_id',
    as: 'doctor',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
}

if (Service && Appointment) {
  Service.hasMany(Appointment, {
    foreignKey: 'service_id',
    as: 'appointments',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  Appointment.belongsTo(Service, {
    foreignKey: 'service_id',
    as: 'service',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
}

if (User && AuditLog) {
  User.hasMany(AuditLog, {
    foreignKey: 'user_id',
    as: 'auditEvents',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  AuditLog.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'actor',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
