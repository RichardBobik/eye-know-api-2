require("dotenv").config();

const express = require("express");
const cors = require("cors");
const knex = require("knex");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

const register = require("./controllers/register");
const signIn = require("./controllers/signIn");
const image = require("./controllers/image");
const imageUrl = require("./controllers/imageUrl");

// const db = knex({
//     client: "pg",
//     connection: {
//         connectionString: process.env.DATABASE_URL,
//         ssl: { rejectUnauthorized: false }
//     }
// });

const db = knex({
  client: "pg",
  connection: {
    port: 5432,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PW,
    database: process.env.DATABASE_DB,
  },
});

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

app.use(express.json());

app.use("/signIn", authLimiter);
app.use("/register", authLimiter);
app.use("/image", authLimiter);
app.use("/imageurl", authLimiter);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    methods: "GET,POST,PUT",
    credentials: true,
  })
);
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.disable("x-powered-by");

app.get("/", (req, res) => {
  res.send("success");
});

app.post(
  "/signIn",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    signIn.handleSignIn(req, res, db, bcrypt);
  }
);

app.post(
  "/register",
  [
    body("name").trim().escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).trim().escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    register.handleRegister(req, res, db, bcrypt);
  }
);

app.put("/image", (req, res) => {
  image.handleImage(req, res, db);
});

app.post("/imageurl", (req, res) => {
  imageUrl.handleImageUrl(req, res);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong!"
      : err.message;

  res.status(500).send(message);
});
