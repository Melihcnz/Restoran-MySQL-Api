module.exports = (sequelize, DataTypes) => {
  const Musteri = sequelize.define('Musteri', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ad_soyad: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    telefon: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    adres: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'musteriler',
    timestamps: false
  });

  // Model ilişkileri
  Musteri.associate = function(models) {
    Musteri.hasMany(models.Siparis, {
      foreignKey: 'musteri_id',
      as: 'siparisler'
    });
    
    Musteri.hasMany(models.Rezervasyon, {
      foreignKey: 'musteri_id',
      as: 'rezervasyonlar'
    });
    
    Musteri.hasMany(models.Fatura, {
      foreignKey: 'musteri_id',
      as: 'faturalar'
    });
  };

  return Musteri;
}; 