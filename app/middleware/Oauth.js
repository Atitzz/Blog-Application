const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const db = require("../models/index");
require("dotenv").config();
const config = process.env;

// กำหนด Google OAuth2 Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/users/auth/google/callback",
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        let user = await db.User.findOne({ where: { googleId: profile.id } });

        if (!user) {

          user = await db.User.create({
            email: profile.email,
            username: profile.displayName, 
            googleId: profile.id, 
            profileImage: profile.picture, 
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    // ค้นหาผู้ใช้โดยใช้ id ที่เข้ารหัสแล้ว
    const user = await db.User.findByPk(id);
    done(null, user); 
  } catch (error) {
    done(error);
  }
});
