module.exports = (sequelize, DataTypes) => {
  const SiparisDetay = sequelize.define('SiparisDetay', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    siparis_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'siparisler',
        key: 'id'
      }
    },
    urun_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'urunler',
        key: 'id'
      }
    },
    miktar: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    birim_fiyat: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    toplam_fiyat: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    notlar: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'siparis_detay',
    timestamps: false,
    hooks: {
      beforeValidate: (siparisDetay) => {
        siparisDetay.toplam_fiyat = siparisDetay.birim_fiyat * siparisDetay.miktar;
      }
    }
  });

  // Model ilişkileri
  SiparisDetay.associate = function(models) {
    SiparisDetay.belongsTo(models.Siparis, {
      foreignKey: 'siparis_id',
      as: 'siparis'
    });
    
    SiparisDetay.belongsTo(models.Urun, {
      foreignKey: 'urun_id',
      as: 'urun'
    });
  };

  return SiparisDetay;
}; 