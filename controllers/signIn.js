const handleSignIn = async (req, res, db, bcrypt) => {
  const { email, password } = req.body;

  try {
    const data = await db
      .select("email", "hash")
      .from("login")
      .where("email", "=", email);

    if (!data.length) {
      return res.status(400).json("Wrong credentials");
    }

    const isValid = await bcrypt.compare(password, data[0].hash);

    if (!isValid) {
      return res.status(400).json("Wrong credentials");
    }

    const users = await db.select("*").from("users").where("email", "=", email);

    res.json(users[0]);
  } catch (err) {
    console.error("Sign-in error:", err);
    res.status(500).json("Internal server error");
  }
};

module.exports = {
  handleSignIn,
};
