// model LikeDislike
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LikeDislike extends Model {
    static associate(models) {
      LikeDislike.belongsTo(models.User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
      LikeDislike.belongsTo(models.Blog, {
        foreignKey: "blogId",
        onDelete: "CASCADE",
      });
    }
  }
  LikeDislike.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      blogId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reaction: {
        type: DataTypes.ENUM("like", "dislike"),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "LikeDislike",
      timestamps: true,
    }
  );
  return LikeDislike;
};
