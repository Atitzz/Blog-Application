const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Blog extends Model {
    static associate(models) {
      Blog.hasMany(models.Comment, {
        foreignKey: "postId",
        as: "comment",
        onDelete: "CASCADE",
      });
      Blog.hasMany(models.Reply, {
        foreignKey: "postId",
        as: "reply",
        onDelete: "CASCADE",
      });
      Blog.belongsTo(models.User, {
        foreignKey: "authorId",
        as: "blogs",
        onDelete: "CASCADE",
      });
      Blog.belongsTo(models.Category, {
        foreignKey: "categoryId",
        onDelete: "CASCADE",
      });
      Blog.hasMany(models.LikeDislike, {
        foreignKey: "blogId",
        onDelete: "CASCADE",
      });
    }
  }
  Blog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: DataTypes.STRING,
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        foreignKey: true,
      },
      content: DataTypes.TEXT,
      img: DataTypes.TEXT,
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      dislikes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Blog",
      timestamps: true,
      indexes: [
        {
          name: "title_index",
          fields: ["title"],
        },
      ],
    }
  );
  return Blog;
};
