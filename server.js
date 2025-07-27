require("dotenv").config();

const express = require("express");
const cors = require("cors");
const knex = require("knex");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { createClient } = require("redis");

const register = require("./controllers/register");
const signIn = require("./controllers/signIn");
const image = require("./controllers/image");
const imageUrl = require("./controllers/imageUrl");
const profile = require("./controllers/profile");
const auth = require("./controllers/authorization");

const db = knex({
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
});

// const db = knex({
//   client: "pg",
//   connection: {
//     port: 5432,
//     host: process.env.DATABASE_HOST,
//     user: process.env.DATABASE_USER,
//     password: process.env.DATABASE_PW,
//     database: process.env.DATABASE_DB,
//     ssl: { rejectUnauthorized: false },
//   },
//   pool: {
//     min: 2,
//     max: 10,
//   },
// });

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6380",
  // socket: {
  //   host: "127.0.0.1",
  //   port: 6380,
  // },
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

redisClient
  .connect()
  .then(() => console.log("Connected to Redis via Upstash"))
  .catch(console.error);

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

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
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  })
);
app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));
app.use(helmet.crossOriginResourcePolicy({ policy: "same-origin" }));

app.disable("x-powered-by");

app.get("/", (req, res) => {
  res.send("success");
});

app.post("/signIn", (req, res) => {
  console.log("Raw body:", req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  signIn.signInAuthentication(db, bcrypt, redisClient)(req, res);
});

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

app.post("/profile/:id", auth.requireAuth(redisClient), (req, res) => {
  profile.handleProfileUpdate(req, res, db);
});

app.get("/profile/:id", auth.requireAuth(redisClient), (req, res) => {
  profile.handleProfileGet(req, res, db, redisClient);
});

app.put("/image", auth.requireAuth(redisClient), (req, res) => {
  image.handleImage(req, res, db);
});

app.post("/imageurl", auth.requireAuth(redisClient), (req, res) => {
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

  res.status(500).json({ error: message });
});
