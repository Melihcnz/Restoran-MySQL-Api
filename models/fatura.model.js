module.exports = (sequelize, DataTypes) => {
  const Fatura = sequelize.define('Fatura', {
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
    musteri_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'musteriler',
        key: 'id'
      }
    },
    odeme_turu: {
      type: DataTypes.ENUM('nakit', 'kredi kartı', 'banka kartı', 'diğer'),
      defaultValue: 'nakit'
    },
    toplam_tutar: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    durum: {
      type: DataTypes.ENUM('ödendi', 'beklemede', 'iptal'),
      defaultValue: 'beklemede'
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'faturalar',
    timestamps: false
  });

  // Model ilişkileri
  Fatura.associate = function(models) {
    Fatura.belongsTo(models.Siparis, {
      foreignKey: 'siparis_id',
      as: 'siparis'
    });
    
    Fatura.belongsTo(models.Musteri, {
      foreignKey: 'musteri_id',
      as: 'musteri'
    });
  };

  return Fatura;
}; 