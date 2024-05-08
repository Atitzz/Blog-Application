const db = require("../../models/index");

const getCategories = async (attributes = [], order = []) => {
  return await db.Category.findAll({
    attributes: attributes.length ? attributes : ["id", "name"],
    order: order ? order : [],
  });
};

const getCategoryCounts = async (categories) => {
  return await Promise.all(
    categories.map(async (category) => {
      const count = await db.Blog.count({
        where: { categoryId: category.id },
      });
      return { name: category.name, count: count };
    })
  );
};

module.exports = { getCategories, getCategoryCounts };
