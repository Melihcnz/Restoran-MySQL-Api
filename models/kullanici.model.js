const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Kullanici = sequelize.define('Kullanici', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    kullanici_adi: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    sifre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ad_soyad: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    yetki: {
      type: DataTypes.ENUM('admin', 'garson', 'kasiyer', 'mutfak'),
      defaultValue: 'garson'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    telefon: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    olusturma_tarihi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'kullanicilar',
    timestamps: false,
    hooks: {
      beforeCreate: async (kullanici) => {
        if (kullanici.sifre) {
          kullanici.sifre = await bcrypt.hash(kullanici.sifre, 10);
        }
      },
      beforeUpdate: async (kullanici) => {
        if (kullanici.changed('sifre')) {
          kullanici.sifre = await bcrypt.hash(kullanici.sifre, 10);
        }
      }
    }
  });

  // Şifre doğrulama metodu
  Kullanici.prototype.sifreDogrula = async function(sifre) {
    return bcrypt.compare(sifre, this.sifre);
  };

  // Model ilişkileri
  Kullanici.associate = function(models) {
    Kullanici.hasMany(models.Siparis, {
      foreignKey: 'kullanici_id',
      as: 'siparisler'
    });
  };

  return Kullanici;
}; 