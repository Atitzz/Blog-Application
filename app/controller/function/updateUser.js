const db = require('../../models/index');

const updateUserAndImage = async (userId, newUsername, newProfileImage) => {
    await db.User.update({ username: newUsername, profileImage: newProfileImage }, { where: { id: userId } });
    await db.Blog.update({ author: newUsername }, { where: { authorId: userId } });
    await db.Comment.update({ username: newUsername }, { where: { userId: userId } });
    await db.Reply.update({ username: newUsername }, { where: { userId: userId } });
};

const updateUser = async (userId, newUsername) => {
    await db.User.update({ username: newUsername }, { where: { id: userId } });
    await db.Blog.update({ author: newUsername }, { where: { authorId: userId } });
    await db.Comment.update({ username: newUsername }, { where: { userId: userId } });
    await db.Reply.update({ username: newUsername }, { where: { userId: userId } });
};

module.exports = { updateUserAndImage, updateUser };