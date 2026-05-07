module.exports = (sequelize, DataTypes) => {
  const ScheduleRule = sequelize.define(
    'ScheduleRule',
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
      weekday: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: {
          min: 1,
          max: 7
        }
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false
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
      tableName: 'schedule_rules',
      underscored: true,
      timestamps: true
    }
  );

  return ScheduleRule;
};
