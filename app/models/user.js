const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Blog, {
        foreignKey: "authorId",
        as: "blogs",
        onDelete: "CASCADE",
      });
      User.hasMany(models.Comment, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
      User.hasMany(models.Reply, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
      User.hasMany(models.LikeDislike, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
      profileImage: {
        type: DataTypes.TEXT,
        defaultValue: "user.jpg",
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      follower: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
      indexes: [
        {
          name: "email_index",
          fields: ["email"],
        },
      ],
    }
  );
  return User;
};
