module.exports = (sequelize, DataTypes) => {
  const Masa = sequelize.define('Masa', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    masa_no: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    durum: {
      type: DataTypes.ENUM('boş', 'dolu'),
      defaultValue: 'boş'
    },
    kapasite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4
    },
    konum: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'salon'
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'masalar',
    timestamps: false
  });

  // Model ilişkileri
  Masa.associate = function(models) {
    Masa.hasMany(models.Siparis, {
      foreignKey: 'masa_id',
      as: 'siparisler'
    });
    
    Masa.hasMany(models.Rezervasyon, {
      foreignKey: 'masa_id',
      as: 'rezervasyonlar'
    });
  };

  return Masa;
}; 