// เอาไว้เช็คการเข้าถึงในหน้าต่างๆ เช่น หน้า register, login
const checkAccessToPage = (req, res, next) => {
  try {
    if (req.cookies && req.cookies.jwt) {
      return res.redirect("/");
    } else if (req.user) {
      return res.redirect("/");
    }

    next();
  } catch (error) {
    console.log(error);
  }
};


// ใช้กับปุ่ม management หน้า member
const checkUser = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      res.redirect('/');
    }
  
    next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = { checkAccessToPage, checkUser };
