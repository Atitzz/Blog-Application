const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Category extends Model {
        static associate(models) {
            Category.hasMany(models.Blog, {
                foreignKey: 'categoryId',
                onDelete: "CASCADE"
            })
        }
     }
    Category.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(30),
            },
        },
        {
            sequelize,
            modelName: "Category",
            timestamps: true,
            indexes: [
                {
                    name: "categoryName_index",
                    fields: ["name"],
                },
            ],
        }
    );
    return Category;
};
