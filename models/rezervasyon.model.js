module.exports = (sequelize, DataTypes) => {
  const Rezervasyon = sequelize.define('Rezervasyon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    musteri_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'musteriler',
        key: 'id'
      }
    },
    masa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'masalar',
        key: 'id'
      }
    },
    tarih: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    saat: {
      type: DataTypes.TIME,
      allowNull: false
    },
    kisi_sayisi: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2
    },
    durum: {
      type: DataTypes.ENUM('onaylandı', 'beklemede', 'iptal'),
      defaultValue: 'beklemede'
    },
    notlar: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'rezervasyonlar',
    timestamps: false
  });

  // Model ilişkileri
  Rezervasyon.associate = function(models) {
    Rezervasyon.belongsTo(models.Musteri, {
      foreignKey: 'musteri_id',
      as: 'musteri'
    });
    
    Rezervasyon.belongsTo(models.Masa, {
      foreignKey: 'masa_id',
      as: 'masa'
    });
  };

  return Rezervasyon;
}; 