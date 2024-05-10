const multer = require('multer');

// อัพโหลดโพสต์
const storageBlog = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './app/public/images');
  },
  filename: function (req, file, cb) {
    cb(null, "Blog-" + Date.now() + "-" + file.originalname);
  }
});

const uploadImageBlog = multer({ storage: storageBlog, }).single('img')

// อัพโหลดรูปโปรไฟล์
const storageProfile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './app/public/profile');
  },
  filename: function (req, file, cb) {
    cb(null, "profile-" + Date.now() + "-" + file.originalname);
  }
});

const uploadImageProfile = multer({ storage: storageProfile }).single('img')


module.exports = { uploadImageBlog, uploadImageProfile };