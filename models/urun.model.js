module.exports = (sequelize, DataTypes) => {
  const Urun = sequelize.define('Urun', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    kategori_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'kategoriler',
        key: 'id'
      }
    },
    ad: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    aciklama: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fiyat: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    resim_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    stok_durumu: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'urunler',
    timestamps: false
  });

  // Model ilişkileri
  Urun.associate = function(models) {
    Urun.belongsTo(models.Kategori, {
      foreignKey: 'kategori_id',
      as: 'kategori'
    });
    
    Urun.hasMany(models.SiparisDetay, {
      foreignKey: 'urun_id',
      as: 'siparis_detaylari'
    });
  };

  return Urun;
}; 