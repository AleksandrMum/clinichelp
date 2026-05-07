module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define(
    'Appointment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      patient_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      doctor_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      service_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      start_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      end_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('created', 'confirmed', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'created'
      },
      booked_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      cancel_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'appointments',
      underscored: true,
      timestamps: true
    }
  );

  return Appointment;
};
