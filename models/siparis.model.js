module.exports = (sequelize, DataTypes) => {
  const Siparis = sequelize.define('Siparis', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    masa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'masalar',
        key: 'id'
      }
    },
    musteri_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'musteriler',
        key: 'id'
      }
    },
    kullanici_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'kullanicilar',
        key: 'id'
      }
    },
    durum: {
      type: DataTypes.ENUM('hazırlanıyor', 'tamamlandı', 'iptal'),
      defaultValue: 'hazırlanıyor'
    },
    toplam_tutar: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    guncelleme_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'siparisler',
    timestamps: false,
    hooks: {
      beforeUpdate: (instance) => {
        instance.guncelleme_tarihi = new Date();
      }
    }
  });

  // Model ilişkileri
  Siparis.associate = function(models) {
    Siparis.belongsTo(models.Masa, {
      foreignKey: 'masa_id',
      as: 'masa'
    });
    
    Siparis.belongsTo(models.Musteri, {
      foreignKey: 'musteri_id',
      as: 'musteri'
    });
    
    Siparis.belongsTo(models.Kullanici, {
      foreignKey: 'kullanici_id',
      as: 'kullanici'
    });
    
    Siparis.hasMany(models.SiparisDetay, {
      foreignKey: 'siparis_id',
      as: 'detaylar'
    });
    
    Siparis.hasOne(models.Fatura, {
      foreignKey: 'siparis_id',
      as: 'fatura'
    });
  };

  return Siparis;
}; 