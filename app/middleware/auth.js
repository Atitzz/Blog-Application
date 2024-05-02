// middleware auth.js
const jwt = require('jsonwebtoken');

require('dotenv').config();
const config = process.env;

const auth = async (req, res, next) => {
    try {
        let token = req.cookies.jwt;
        let user;

        // สำหรับผู้ใช้ที่สมัครสมาชิกกับเว็บ
        if (token) {
            const decoded = jwt.verify(token, config.TOKEN);
            user = decoded.user;
        }

        // สำหรับผู้ใช้ที่ Login ผ่าน Oauth 
        if (!token) {
            if (req.user) {
                user = req.user;
            }
        }

        if (!user) {
            return res.redirect('/users/login');
        }

        req.user = user; 
        next();
    } catch (error) {
        console.log(error);
        return res.send('Invalid token');
    }
}

module.exports = auth;
