const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const passport = require('passport');
const app = express();

const connectDB = require("./config/connect");
const router = require("./routes");
const configViewEngine = require("./config/viewEngine");
const { descriptionText } = require("./service/REUSE");

require("dotenv").config();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
})
