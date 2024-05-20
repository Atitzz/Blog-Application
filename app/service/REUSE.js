const db = require("../models/index");
const getCategoryByName = async (name) => {
  return db.Category.findOne({ where: { name: name } });
};

const createCategories = async (name) => {
  return await db.Category.create({ name: name });
};

const getCategoryAll = async (attributes = [], order = []) => {
  return db.Category.findAll({
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

const getCommentCounts = async (blogs) => {
  return await Promise.all(
    blogs.map(async (blog) => {
      const countComments = await db.Comment.count({
        where: { postId: blog.id },
      });
      const countReplies = await db.Reply.count({
        where: { postId: blog.id },
      });
      const totalCount = countComments + countReplies;
      return { postId: blog.id, count: totalCount, showLike: blog.likes };
    })
  );
};

// function show description for specified text
const descriptionText = (text, length) => {
  if (text.length <= length) {
    return text;
  } else {
    return text.substring(0, length) + "...";
  }
};

module.exports = {
  getCategoryByName,
  createCategories,
  getCategoryAll,
  getCategoryCounts,
  getCommentCounts,
  descriptionText,
};
