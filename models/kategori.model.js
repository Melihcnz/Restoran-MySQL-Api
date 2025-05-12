module.exports = (sequelize, DataTypes) => {
  const Kategori = sequelize.define('Kategori', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ad: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    aciklama: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sira_no: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'kategoriler',
    timestamps: false
  });

  // Model ilişkileri
  Kategori.associate = function(models) {
    Kategori.hasMany(models.Urun, {
      foreignKey: 'kategori_id',
      as: 'urunler'
    });
  };

  return Kategori;
}; 