module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      action_type: {
        type: DataTypes.STRING(80),
        allowNull: false
      },
      entity_type: {
        type: DataTypes.STRING(80),
        allowNull: false
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      action_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      tableName: 'audit_log',
      underscored: true,
      timestamps: true,
      updatedAt: false
    }
  );

  return AuditLog;
};
