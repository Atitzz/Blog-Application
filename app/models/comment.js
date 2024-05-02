const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Comment extends Model {
        static associate(models) {
            Comment.belongsTo(models.Blog, {
                foreignKey: 'postId',
                as: "comment",
                onDelete: "CASCADE"
            });
            Comment.belongsTo(models.User, {
                foreignKey: 'userId',
                onDelete: "CASCADE"
            })
            Comment.hasMany(models.Reply, {
                foreignKey: "commentId",
                as: "Replies",
                onDelete: "CASCADE"
            });
        }
    }
    Comment.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            postId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                foreignKey: true
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                foreignKey: true
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "Comment",
            timestamps: true,
            indexes: [
                {
                    name: 'commentId_index',
                    fields: ['id']
                }
            ]
        }
    );
    return Comment;
};
