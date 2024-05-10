//model Follow
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Follow extends Model {
    static associate(models) {
      Follow.belongsTo(models.User, {
        foreignKey: "user_followerId",
        as: "follower",
        onDelete: "CASCADE",
      });
      Follow.belongsTo(models.User, {
        foreignKey: "authorId",
        as: "author",
        onDelete: "CASCADE",
      });
    }
  }
  Follow.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_followerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true,
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "follower",
      },
    },
    {
      sequelize,
      modelName: "Follow",
      timestamps: true,
    }
  );
  return Follow;
};
