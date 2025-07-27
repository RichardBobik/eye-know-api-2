const handleProfileGet = async (req, res, db, redisClient) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json("Unauthorized - no token provided");
  }

  try {
    const sessionId = await redisClient.get(authorization);

    if (!sessionId) {
      return res.status(401).json("Unauthorized - invalid token");
    }

    // Optional: Check that the session ID matches requested ID
    // if (sessionId !== id) return res.status(403).json("Forbidden");

    const user = await db.select("*").from("users").where({ id });

    if (user.length) {
      res.json(user[0]);
    } else {
      res.status(404).json("User not found");
    }
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json("Error fetching user profile");
  }
};

const handleProfileUpdate = async (req, res, db) => {
  console.log("Request body:", req.body);
  const { id } = req.params;
  const { name, age, pet } = req.body.formInput;

  try {
    const updatedUsers = await db("users")
      .where({ id })
      .update({ name, age, pet })
      .returning("*");

    if (updatedUsers.length) {
      res.json(updatedUsers[0]); // Return the updated user object
    } else {
      res.status(400).json("Unable to update user");
    }
  } catch (err) {
    console.error(err);
    res.status(400).json("Error updating user");
  }
};

module.exports = {
  handleProfileGet,
  handleProfileUpdate,
};
