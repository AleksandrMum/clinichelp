module.exports = (sequelize, DataTypes) => {
  const ScheduleException = sequelize.define(
    'ScheduleException',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      doctor_id: {
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
      exception_type: {
        type: DataTypes.ENUM('day_off', 'extra_shift'),
        allowNull: false
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_archived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      archived_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'schedule_exceptions',
      underscored: true,
      timestamps: true
    }
  );

  return ScheduleException;
};
