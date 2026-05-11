module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define(
    'Patient',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      full_name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      notes: {
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
      tableName: 'patients',
      underscored: true,
      timestamps: true
    }
  );

  return Patient;
};
