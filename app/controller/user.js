const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const db = require("../models/index");
const day = require("dayjs");
const passport = require("passport");
require("../middleware/Oauth");

require("dotenv").config();
const config = process.env;

const {
  createUser,
  getUserInfo,
  getUserNormal,
  updateUserAndImage,
  updateUser,
} = require("../service/USER");

// แบบฟอร์มสมัครสมาชิก
const formRegister = (req, res) => {
  try {
    const message = req.flash("error");
    const googleUser = req.user || null;
    res.render("users/register", { message, googleUser });
  } catch (error) {
    console.log(error);
  }
};

// สมัครสมาชิก (ตัวอย่างนี้ validate จาก controller)
const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const existingUser = await db.User.findOne({
      where: { email: email },
    });

    if (existingUser) {
      req.flash("error", "อีเมล์นี้ถูกใช้แล้ว");
      return res.redirect("/users/register");
    } else {
      const hash = await bcrypt.hash(password, 10);
      await createUser(email, username, hash);

      res.redirect("/users/registerSuccess");
    }
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มเข้าสู่ระบบ
const formLogin = (req, res) => {
  try {
    const message = req.flash("error");
    const googleUser = req.user || null;
    res.render("users/login", { message, googleUser });
  } catch (error) {
    console.log(error);
  }
};

// เข้าสู่ระบบ
const login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    const user = await db.User.findOne({
      where: { email: email },
    });
    if (!user) {
      req.flash("error", "ไม่มีชื่อนี้อยู่ในระบบ");
      return res.redirect("/users/login");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "รหัสผ่านไม่ถูกต้อง");
      return res.redirect("/users/login");
    }
    let payload = {
      user: {
        user: user,
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
    if (remember) {
      const token = jwt.sign(payload, config.TOKEN, { expiresIn: "1d" });
      res.cookie("jwt", token, { httpOnly: true, maxAge: 3600000 }); //ส่ง token
      res.cookie("user", user.username, { httpOnly: true, maxAge: 3600000 }); //ส่ง ชื่อ
    } else {
      const token = jwt.sign(payload, config.TOKEN, { expiresIn: "10m" });
      res.cookie("jwt", token, { httpOnly: true, maxAge: 600000 }); //ส่ง token
      res.cookie("user", user.username, { httpOnly: true, maxAge: 600000 }); //ส่ง ชื่อ
    }

    // ตรวจสอบ URL ที่เก็บไว้ใน session หากมีให้นำผู้ใช้ไปยัง URL นั้น หากไม่มีให้นำผู้ใช้ไปยังหน้าหลัก (index)
    const returnTo = req.session.returnTo || "/";
    delete req.session.returnTo;
    req.flash("success", user.username, "เข้าสู่ระบบเรียบร้อยแล้ว");
    res.redirect(returnTo);
  } catch (error) {
    console.log(error);
  }
};

// ออกจากระบบ
const logout = (req, res) => {
  try {
    // Logout Google
    req.session.destroy(); // Destroy the session

    // Logout JWT
    res.clearCookie("jwt");
    res.clearCookie("user");
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

// ดูสมาชิก
const members = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const message = req.flash("error");

    let members = [];
    const { search } = req.query;
    if (search) {
      members = await db.User.findAll({
        attributes: ["id", "username", "role", "profileImage", "createdAt"],
        where: {
          username: { [Op.iLike]: `${search}%` },
        },
        order: [
          ["role", "ASC"],
          ["createdAt", "ASC"],
        ],
      });
    } else {
      members = await db.User.findAll({
        attributes: ["id", "username", "role", "profileImage", "createdAt"],
        order: [
          ["role", "ASC"],
          ["createdAt", "ASC"],
        ],
      });
    }

    res.render("users/member", {
      user,
      showUsername,
      googleUser,
      userNormal,
      message,
      members,
      day,
    });
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มจัดการสมาชิก
const formManagement = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");

    const { search } = req.query;
    let members = [];

    if (search) {
      members = await db.User.findAll({
        attributes: ["id", "username", "email", "role"],
        where: {
          [Op.or]: [
            { username: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
          ],
        },
        order: [["username", "ASC"]],
      });
    } else {
      members = await db.User.findAll({
        attributes: ["id", "username", "email", "role"],
        order: [["username", "ASC"]],
      });
    }

    res.render("users/admin", {
      user,
      successMessage,
      errorMessage,
      members,
      showUsername,
      userNormal,
      googleUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// ปรับ user or admin
const changeRole = async (req, res) => {
  try {
    const user = req.user;
    const { userId, changeRole } = req.body;
    const users = await db.User.findByPk(userId);

    if (user && user.role === "admin") {
      await db.User.update({ role: changeRole }, { where: { id: userId } });
      req.flash("success", `Updated user ${users.email}`);
    } else {
      req.flash("error", `คุณไม่ได้รับสิทธิ์การปรับตำแหน่ง`);
    }
    res.redirect("/users/management");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update user role");
    res.redirect("/users/management");
  }
};

// ลบสมาชิก
const deleteUser = async (req, res) => {
  try {
    const user = req.user;
    const userId = req.params.id;
    const checkUser = await db.User.findByPk(userId);

    const imagePath = path.join(
      __dirname,
      "../public/profile/" + checkUser.profileImage
    );

    // ลบ account โดย admin //
    if (user && user.role === "admin") {
      if (
        checkUser &&
        checkUser.profileImage !== null &&
        checkUser.profileImage !== "user.jpg"
      ) {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      await db.User.destroy({ where: { id: userId } });

      req.flash("success", `deleted '${checkUser.username}' successfully`);
      res.redirect("/users/management");

      // ลบ account ตัวเอง //
    } else if (user && user.id === checkUser.id) {
      if (
        checkUser &&
        checkUser.profileImage !== null &&
        checkUser.profileImage !== "user.jpg"
      ) {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      await db.User.destroy({ where: { id: userId } });

      res.redirect("/users/logout");
    } else {
      req.flash("error", "คุณไม่มีสิทธิในการจัดการสมาชิก");
      return res.redirect("/users/management");
    }
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มแก้ไขข้อมูลส่วนตัว
const editProfileForm = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const authorId = req.params.id;
    const author = await db.User.findByPk(authorId);
    const messageSuccess = req.flash("success");
    const messageError = req.flash("error");

    res.render("editProfile", {
      author,
      user,
      messageSuccess,
      messageError,
      showUsername,
      userNormal,
      googleUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// แก้ไขข้อมูลส่วนตัว (รูป, ชื่อ)
const editProfile = async (req, res) => {
  try {
    const authorId = req.params.id;
    const { username } = req.body;
    const image = req.file ? req.file.filename : null;
    const user = req.user.id;

    const existingUser = await db.User.findByPk(authorId);

    if (user == existingUser.id) {
      if (image) {
        if (
          existingUser &&
          existingUser.profileImage !== null &&
          existingUser.profileImage !== "user.jpg"
        ) {
          const imagePath = path.join(
            __dirname,
            "../public/profile/" + existingUser.profileImage
          );
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        await updateUserAndImage(authorId, username, image);
      } else {
        await updateUser(authorId, username);
      }
      res.cookie('user', username);
      req.flash("success", "Successfully updated");
      res.redirect(`/users/edit-profile/${authorId}`);
    } else {
      req.flash("error", "คุณไม่มีสิทธิ์ในการอัพเดทข้อมูลนี้");
      res.redirect(`/users/edit-profile/${authorId}`);
    }
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มแจ้งเตือนหลังจากสมัครสมาชิกสำเร็จ
const registerSuccess = (req, res) => {
  try {
    res.render("users/registerSuccess");
  } catch (error) {
    console.log(error);
  }
};

const follow = async (req, res) => {
  try {
    const userId = req.user.id;
    const authorId = req.params.id;
    const existingFollow = await db.Follow.findOne({
      where: {
        user_followerId: userId,
        authorId: authorId,
      },
    });

    if (!existingFollow) {
      await db.Follow.create({
        user_followerId: userId,
        authorId: authorId,
        status: "follower",
      });
      await db.User.increment({ follower: 1 }, { where: { id: authorId } });
    } else {
      await db.Follow.destroy({
        where: {
          user_followerId: userId,
          authorId: authorId,
        },
      });
      await db.User.decrement({ follower: 1 }, { where: { id: authorId } });
    }

    const returnTo = req.session.returnTo || "/";
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (error) {
    console.log(error);
  }
};

const googleAuth = passport.authenticate("google", {
  scope: ["email", "profile"],
});

const googleCallback = (req, res) => {
  passport.authenticate("google", {
    failureRedirect: "/users/login",
    failureFlash: true,
  })(req, res, () => {
    req.flash("success", req.user.username, "เข้าสู่ระบบเรียบร้อยแล้ว");
    res.redirect("/");
  });
};

module.exports = {
  formRegister,
  register,
  formLogin,
  login,
  logout,
  members,
  formManagement,
  changeRole,
  deleteUser,
  editProfileForm,
  editProfile,
  registerSuccess,
  follow,
  googleAuth,
  googleCallback,
};
