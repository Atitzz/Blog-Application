const db = require("../models/index");

const getUserInfo = (req) => {
  const user = req.cookies && req.cookies.jwt;
  const showUsername = req.cookies && req.cookies.user;
  const googleUser = req.user || null;
  return { user, showUsername, googleUser };
};

const getUserNormal = async (showUsername) => {
  return showUsername
    ? await db.User.findOne({ where: { username: showUsername } })
    : null;
};

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
  getCategories,
  getCategoryCounts,
  getUserInfo,
  getUserNormal,
  getCommentCounts,
  descriptionText,
};
