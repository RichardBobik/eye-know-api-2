const jwt = require("jsonwebtoken");

const handleSignIn = async (req, db, bcrypt) => {
  const email = req.body.email.toLowerCase();
  const { password } = req.body;

  const data = await db
    .select("email", "hash")
    .from("login")
    .where("email", "=", email);

  if (!data.length) {
    return Promise.reject("Wrong credentials");
  }

  const isValid = await bcrypt.compare(password, data[0].hash);

  if (!isValid) {
    return Promise.reject("Wrong credentials");
  }

  const users = await db.select("*").from("users").where("email", "=", email);
  return users[0];
};

const getAuthTokenId = async (req, res, redisClient) => {
  const { authorization } = req.headers;

  try {
    const userId = await redisClient.get(authorization);

    if (!userId) {
      return res.status(400).json("Unauthorized");
    }

    return res.json({ id: userId });
  } catch (err) {
    console.error("Redis error:", err);
    return res.status(500).json("Server error while verifying token");
  }
};

const createSessions = (user, redisClient) => {
  const { email, id } = user;
  const token = signToken(email);
  return setToken(token, id, redisClient)
    .then(() => {
      return { success: "true", userId: id, token };
    })
    .catch(console.log);
};

const setToken = (token, id, redisClient) => {
  const EXPIRATION_SECONDS = 60 * 60 * 24 * 2;
  return redisClient.set(token, id, { EX: EXPIRATION_SECONDS });
};

const signToken = (email) => {
  const jwtPayload = { email };
  return jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: "2 days" });
};

const signInAuthentication = (db, bcrypt, redisClient) => async (req, res) => {
  const { authorization } = req.headers;
  console.log("Inside signInAuthentication");

  if (authorization) {
    return getAuthTokenId(req, res, redisClient);
  }

  try {
    const data = await handleSignIn(req, db, bcrypt);
    const session = await createSessions(data, redisClient);
    return res.json(session);
  } catch (err) {
    console.error("SignIn error:", err);
    return res.status(400).json("Wrong credentials");
  }
};

module.exports = {
  signInAuthentication,
};
