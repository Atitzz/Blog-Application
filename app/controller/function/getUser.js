const db = require('../../models/index');

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

module.exports = { getUserInfo, getUserNormal };
