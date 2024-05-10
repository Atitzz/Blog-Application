const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");

const passport = require('passport');

const connectDB = require("./config/connect");
const router = require("./routes");
const configViewEngine = require("./config/viewEngine");
const { descriptionText } = require("./service/REUSE");

const app = express();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(require("connect-flash")());

app.locals.descriptionText = descriptionText;

configViewEngine(app);
router(app);
connectDB();

module.exports = app;
