const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Reply extends Model {
        static associate(models) {
            Reply.belongsTo(models.Comment, {
                foreignKey: "commentId",
                onDelete: "CASCADE"
            });
            Reply.belongsTo(models.Blog, {
                foreignKey: "postId",
                as: "reply",
                onDelete: "CASCADE"
            });
            Reply.belongsTo(models.User, {
                foreignKey: "userId",
                onDelete: "CASCADE"
            });
        }
    }
    Reply.init(
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
            commentId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                foreignKey: true,
            },
            postId: DataTypes.INTEGER,
            userId: DataTypes.INTEGER,
            username: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "Reply",
            timestamps: true,
            indexes: [
                {
                    name: 'replyId_index',
                    fields: ['id']
                }
            ]
        }
    );
    return Reply;
};
