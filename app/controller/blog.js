const db = require("../models/index");
const day = require("dayjs");
const { Op, Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

const {
  getCategoryByName,
  createCategories,
  getCategoryAll,
  getCategoryCounts,
  getCommentCounts,
} = require("../service/REUSE");

const { getUserInfo, getUserNormal } = require("../service/USER");

// index (show post & set page)
const index = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const message = req.flash("success");

    // แสดง category ตรง sidebar
    const categories = await getCategoryAll();
    const categoryCounts = await getCategoryCounts(categories);

    // กำหนดเพื่อทำ pagination //
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;

    const { count, rows: blogs } = await db.Blog.findAndCountAll({
      include: [
        {
          model: db.User,
          as: "blogs",
        },
      ],
      offset: (page - 1) * perPage,
      limit: perPage,
      order: [["title", "ASC"]],
    });

    const pageCount = Math.ceil(count / perPage);

    // นับจำนวน Comment และ Reply ของแต่ละ Blog
    const commentCounts = await getCommentCounts(blogs);

    // แสดง Blog ล่าสุดบน Banner
    const latestBlog = await db.Blog.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // แสดง Blog ที่ถูกกด like มากที่สุด
    const topLikedBlogs = await db.Blog.findAll({
      order: [["likes", "DESC"]],
      limit: 3,
    });

    // แสดง Blog ที่มียอดเข้าชมมากที่สุด
    const topViewsBlogs = await db.Blog.findAll({
      order: [["views", "DESC"]],
      limit: 3,
    });

    res.render("index", {
      posts: blogs,
      categoryCounts,
      commentCounts,
      day: day,
      currentPage: page,
      pageCount: pageCount,
      message,
      user,
      showUsername,
      userNormal,
      googleUser,
      topLikedBlogs,
      topViewsBlogs,
      latestBlog,
    });
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มบันทึกหมวดหมู่
const formCategory = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const messageError = req.flash("error");
    const messageSuccess = req.flash("success");
    const category = await getCategoryAll(["id", "name"], [["name"]]);
    res.render("addCategory", {
      categories: category,
      messageError,
      messageSuccess,
      user,
      showUsername,
      userNormal,
      googleUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// บันทึกหมวดหมู่
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const existingCategory = await getCategoryByName(name);

    if (req.user.role === "admin") {
      if (existingCategory) {
        req.flash("error", "มีหมวดหมู่นี้แล้ว");
      } else {
        await createCategories(name);
        req.flash("success", "Successfully added category");
      }
    } else {
      req.flash("error", "คุณไม่มีสิทธิ์ในการเพิ่มหมวดหมู่");
    }
    res.redirect("/category/add");
  } catch (error) {
    console.log(error);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);
    const { id } = req.params;

    if (
      (userNormal && userNormal.role === "admin") ||
      (googleUser && googleUser.role == "admin")
    ) {
      await db.Category.destroy({ where: { id: id } });
      req.flash("success", `Successfully deleted`);
    } else {
      req.flash("error", "คุณไม่มีสิทธิลบข้อมูลนี้");
    }
    res.redirect("/category/add");
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มบันทึกโพสต์
const formAddPost = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const userId = req.user.id;
    const username = req.user.username;
    const category = await getCategoryAll(["name", "id"], [["name"]]);

    res.render("addPost", {
      categories: category,
      user,
      username,
      userId,
      showUsername,
      userNormal,
      googleUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// บันทึกโพสต์
const createPost = async (req, res) => {
  try {
    const { title, categoryId, content, author, authorId } = req.body;
    const projectImage = req.file ? req.file.filename : null;

    const category = await db.Category.findOne({
      attributes: ["id", "name"],
      where: { id: categoryId },
    });

    const blog = await db.Blog.create({
      title,
      category: category.name,
      content,
      img: projectImage,
      author,
      authorId,
      categoryId,
    });

    req.flash("success", `Blog created successfully By:  ${author}`);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

// แบบฟอร์มแก้ไขโพสต์
const formEdit = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const postId = req.params.id;
    const blog = await db.Blog.findByPk(postId);

    const category = await getCategoryAll(["name"], [["name"]]);

    const message = req.flash("error");

    res.render("editPost", {
      blog: [blog],
      categories: category,
      user,
      message,
      showUsername,
      userNormal,
      googleUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// แก้ไขโพสต์
const editPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, category, content } = req.body;
    const uploadedImage = req.file ? req.file.filename : null;

    const loggedInUserId = req.user.id;
    const existingPost = await db.Blog.findByPk(postId); //เอาไว้ค้นหา authorId, img

    const imagePath = path.join(
      __dirname,
      "../public/images/" + existingPost.img
    );

    if (loggedInUserId == existingPost.authorId) {
      //เป็นผู้โพสหรือไม่
      if (uploadedImage) {
        //มีการอัพโหลดรูปหรือไม่
        if (existingPost && existingPost.img) {
          //มีโพสนี้หรือไม่
          if (fs.existsSync(imagePath)) {
            //ถ้ามีรูปใน images ค่อยลบ
            fs.unlinkSync(imagePath);
          }
          await db.Blog.update(
            { title, category, content, img: uploadedImage },
            { where: { id: postId } }
          );
        }
      } else {
        await db.Blog.update(
          { title, category, content },
          { where: { id: postId } }
        );
      }
      req.flash("success", "Successfully updated");
      res.redirect(`/show/${postId}`);
    } else {
      req.flash("error", "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้");
      res.redirect(`/edit/${postId}`);
    }
  } catch (error) {
    console.log(error);
  }
};

// show search results
const search = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    // แสดง category และนับจำนวนทั้งหมด (ใช้กับ sidebar)
    const categories = await getCategoryAll();
    const categoryCounts = await getCategoryCounts(categories);

    const { search, category, author, page } = req.query;

    const perPage = 5; // จำนวนบทความต่อหน้า
    const currentPage = parseInt(page) || 1; // หน้าปัจจุบัน

    let blogs = [];
    let totalBlogs = 0;

    if (search) {
      const { count, rows } = await db.Blog.findAndCountAll({
        where: {
          [Op.or]: [
            { category: { [Op.iLike]: `${search}%` } },
            { author: { [Op.iLike]: `${search}%` } },
            { title: { [Op.iLike]: `%${search}%` } },
          ],
        },
        order: [
          ["title", "ASC"],
          ["views", "DESC"],
        ],
        offset: (currentPage - 1) * perPage,
        limit: perPage,
        include: [
          {
            model: db.User,
            as: "blogs",
          },
        ],
      });
      blogs = rows;
      totalBlogs = count;
    } else if (author || category) {
      const query = {};
      if (author) {
        query.author = author;
      }
      if (category) {
        query.category = category;
      }

      const { count, rows } = await db.Blog.findAndCountAll({
        where: query,
        order: [
          ["title", "ASC"],
          ["views", "DESC"],
        ],
        offset: (currentPage - 1) * perPage,
        limit: perPage,
        include: [
          {
            model: db.User,
            as: "blogs",
          },
        ],
      });
      blogs = rows;
      totalBlogs = count;
    } else {
      const { count, rows } = await db.Blog.findAndCountAll({
        offset: (currentPage - 1) * perPage,
        limit: perPage,
        oder: [["title", "ASC"]],
        include: [
          {
            model: db.User,
            as: "blogs",
          },
        ],
      });
      blogs = rows;
      totalBlogs = count;
    }

    const pageCount = Math.ceil(totalBlogs / perPage);

    // นับจำนวน Comment และ Reply ของแต่ละ Blog
    const commentCounts = await getCommentCounts(blogs);

    // ใส่ [] กัน error จาก sidebar
    const topLikedBlogs = [];
    const topViewsBlogs = [];

    res.render("search", {
      posts: blogs,
      categoryCounts,
      commentCounts,
      search: search || author || category,
      day: day,
      user,
      currentPage,
      pageCount,
      showUsername,
      userNormal,
      googleUser,
      topLikedBlogs,
      topViewsBlogs,
    });
  } catch (error) {
    console.log(error);
  }
};

// โชว์รายชื่อและโพสต์ของผู้เขียน
const author = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const { search } = req.query;
    let author = [];
    if (search) {
      author = await db.User.findAll({
        attributes: ["id", "username", "profileImage", "follower"],
        include: [
          {
            model: db.Blog,
            as: "blogs",
            attributes: ["title", "id"],
          },
        ],
        where: {
          [Op.or]: [{ username: { [Op.iLike]: `${search}%` } }],
          "$blogs.id$": { [Op.ne]: null },
        },
      });
    } else {
      author = await db.User.findAll({
        attributes: ["username", "id", "profileImage", "follower"],
        include: [
          {
            model: db.Blog,
            as: "blogs",
            attributes: ["title", "id"],
          },
        ],
        order: [["username"], ["blogs", "title", "ASC"]], //ถ้าเรียงลำดับ ของ model ที่ include ต้องแยกอีก Array และใส่ชื่อ model นำหน้าด้วย//
        where: {
          "$blogs.id$": { [Op.ne]: null }, //ค้นหาเฉพาะผู้ที่มี Blog ของตัวเอง
          //'$blogs.id$' = คือการเข้าถึงข้อมูลของ model ที่ถูก include เข้ามา (ต้องเป็น fk)
        },
      });
    }

    // แสดง action Follower
    let userId = userNormal ? userNormal.id : googleUser ? googleUser.id : null;
    const existingFollower = await db.Follow.findAll({
      where: {
        user_followerId: userId,
      },
    });

    req.session.returnTo = req.originalUrl;

    res.render("author", {
      authors: author,
      user,
      showUsername,
      userNormal,
      googleUser,
      existingFollower,
    });
  } catch (error) {
    console.error(error);
  }
};

// อ่านตัวเต็มของโพสต์
const readMore = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    const message = req.flash("success");

    const postId = req.params.id;
    const posts = await db.Blog.findByPk(postId);

    // แสดง category และนับจำนวนทั้งหมด (ใช้กับ sidebar)
    const categories = await getCategoryAll();
    const categoryCounts = await getCategoryCounts(categories);

    // เพิ่มยอดวิว
    await db.Blog.increment({ views: 1 }, { where: { id: postId } });

    // แสดง action like or dislike
    let userId = userNormal ? userNormal.id : googleUser ? googleUser.id : null;
    const userReactions = await db.LikeDislike.findOne({
      where: {
        userId: userId,
        blogId: postId,
      },
    });

    // แสดงปุ่ม Follow
    const existingFollower = await db.Follow.findAll({
      where: {
        user_followerId: userId,
      },
    });

    // แสดง comment เฉพาะ blog นั้นๆ
    const comments = await db.Comment.findAll({
      attributes: ["id", "content", "createdAt", "username", "userId"],
      where: { postId: postId },
      include: [
        {
          model: db.Reply,
          as: "Replies",
          attributes: ["id", "content", "createdAt", "username", "userId"],
          include: [
            {
              model: db.User,
              attributes: ["profileImage"],
              required: false,
            },
          ],
        },
        {
          model: db.User,
          attributes: ["profileImage", "username"],
          required: false,
        },
      ],
    });

    // ใส่ [] กัน error จาก sidebar
    const topLikedBlogs = [];
    const topViewsBlogs = [];

    // เก็บ Url ไว้ใน session เพื่อให้หลัง login เด้งกลับมาหน้าเดิม
    req.session.returnTo = req.originalUrl;

    res.render("readMore", {
      posts: [posts],
      userReactions,
      categoryCounts,
      day: day,
      Comments: comments,
      user: user,
      message,
      showUsername,
      userNormal,
      googleUser,
      existingFollower,
      topLikedBlogs,
      topViewsBlogs,
    });
  } catch (error) {
    console.log(error);
  }
};

// เพิ่มคอมเมนท์
const addComment = async (req, res) => {
  try {
    const postId = req.params.id; //id ของ blog
    const userId = req.user.id; //id ของ user ที่ comment
    const username = req.user.username;
    const { comment } = req.body;

    const newComment = await db.Comment.create({
      postId,
      userId,
      content: comment,
      username: username,
    });

    res.redirect(`/show/${postId}`);
  } catch (error) {
    console.log(error);
  }
};

// ตอบคอมเมนท์
const reply = async (req, res) => {
  try {
    const postId = req.params.id; //id ของ blog
    const commentId = req.params.comment; //id ของ comment
    const userId = req.user.id; // id ของ user ที่ reply
    const username = req.user.username;
    const { reply } = req.body;

    const replyComment = await db.Reply.create({
      postId,
      commentId,
      userId,
      content: reply,
      username: username,
    });

    res.redirect(`/show/${postId}`);
  } catch (error) {
    console.log(error);
  }
};

const likePost = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    // ตรวจสอบว่า user ได้กด like หรือ dislike บล็อกนี้ไว้แล้วหรือไม่
    const existingReaction = await db.LikeDislike.findOne({
      where: {
        userId: userId,
        blogId: blogId,
      },
    });

    if (existingReaction) {
      // ถ้า user ได้กด reaction ไว้แล้ว
      if (existingReaction.reaction === "like") {
        // ถ้า reaction เดิมคือ like ให้ลบ like ออก
        await db.LikeDislike.destroy({
          where: {
            userId: userId,
            blogId: blogId,
            reaction: "like",
          },
        });
        // ลดจำนวน Likes ในโพสต์
        await db.Blog.decrement({ likes: 1 }, { where: { id: blogId } });
      } else {
        // ถ้า reaction เดิมคือ dislike ให้เปลี่ยนเป็น like
        await db.LikeDislike.update(
          { reaction: "like" },
          {
            where: {
              userId: userId,
              blogId: blogId,
            },
          }
        );
        // เพิ่มจำนวน Likes และลด Dislikes ในโพสต์
        await db.Blog.increment(
          { likes: 1, dislikes: -1 },
          { where: { id: blogId } }
        );
      }
    } else {
      // ถ้า user ยังไม่ได้กด reaction ไว้ ให้เพิ่ม like เข้าไป
      await db.LikeDislike.create({
        userId: userId,
        blogId: blogId,
        reaction: "like",
      });
      // เพิ่มจำนวน Likes ในโพสต์
      await db.Blog.increment({ likes: 1 }, { where: { id: blogId } });
    }

    // รีเดิมหน้าหลังจากการกด like
    res.redirect(`/show/${blogId}`);
  } catch (error) {
    console.log(error);
  }
};

const dislikePost = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    // ตรวจสอบว่า user ได้กด like หรือ dislike บล็อกนี้ไว้แล้วหรือไม่
    const existingReaction = await db.LikeDislike.findOne({
      where: {
        userId: userId,
        blogId: blogId,
      },
    });

    if (existingReaction) {
      // ถ้า user ได้กด reaction ไว้แล้ว
      if (existingReaction.reaction === "dislike") {
        // ถ้า reaction เดิมคือ dislike ให้ลบ dislike ออก
        await db.LikeDislike.destroy({
          where: {
            userId: userId,
            blogId: blogId,
            reaction: "dislike",
          },
        });
        // ลดจำนวน Dislikes ในโพสต์
        await db.Blog.decrement({ dislikes: 1 }, { where: { id: blogId } });
      } else {
        // ถ้า reaction เดิมคือ like ให้เปลี่ยนเป็น dislike
        await db.LikeDislike.update(
          { reaction: "dislike" },
          {
            where: {
              userId: userId,
              blogId: blogId,
            },
          }
        );
        // เพิ่มจำนวน Dislikes และลด Likes ในโพสต์
        await db.Blog.increment(
          { dislikes: 1, likes: -1 },
          { where: { id: blogId } }
        );
      }
    } else {
      // ถ้า user ยังไม่ได้กด reaction ไว้ ให้เพิ่ม dislike เข้าไป
      await db.LikeDislike.create({
        userId: userId,
        blogId: blogId,
        reaction: "dislike",
      });
      // เพิ่มจำนวน Dislikes ในโพสต์
      await db.Blog.increment({ dislikes: 1 }, { where: { id: blogId } });
    }

    res.redirect(`/show/${blogId}`);
  } catch (error) {
    console.log(error);
  }
};

const about = async (req, res) => {
  try {
    const { user, showUsername, googleUser } = getUserInfo(req);
    const userNormal = await getUserNormal(showUsername);

    res.render("about", { user, showUsername, googleUser, userNormal });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  index,
  formCategory,
  createCategory,
  deleteCategory,
  formAddPost,
  createPost,
  formEdit,
  editPost,
  search,
  author,
  readMore,
  addComment,
  reply,
  likePost,
  dislikePost,
  about,
};
