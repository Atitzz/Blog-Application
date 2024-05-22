const db = require("../models/index");

const createUser = async (email, username, password, profileImage) => {
  await db.User.create({
    email,
    username,
    password,
    profileImage: "user.jpg",
  });
};

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

const updateUserAndImage = async (userId, newUsername, newProfileImage) => {
  await db.User.update(
    { username: newUsername, profileImage: newProfileImage },
    { where: { id: userId } }
  );
  await db.Blog.update(
    { author: newUsername },
    { where: { authorId: userId } }
  );
  await db.Comment.update(
    { username: newUsername },
    { where: { userId: userId } }
  );
  await db.Reply.update(
    { username: newUsername },
    { where: { userId: userId } }
  );
};

const updateUser = async (userId, newUsername) => {
  await db.User.update({ username: newUsername }, { where: { id: userId } });
  await db.Blog.update(
    { author: newUsername },
    { where: { authorId: userId } }
  );
  await db.Comment.update(
    { username: newUsername },
    { where: { userId: userId } }
  );
  await db.Reply.update(
    { username: newUsername },
    { where: { userId: userId } }
  );
};

module.exports = { createUser, getUserInfo, getUserNormal, updateUserAndImage, updateUser };
