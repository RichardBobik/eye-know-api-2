const handleRegister = async (req, res, db, bcrypt) => {
  const { email: rawEmail, name, password } = req.body;
  const email = rawEmail.toLowerCase();

  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    await db.transaction(async (trx) => {
      const loginEmail = await trx("login")
        .insert({ hash, email })
        .returning("email");

      const user = await trx("users")
        .insert({
          email: loginEmail[0].email,
          name,
          joined: new Date(),
        })
        .returning("*");

      res.json(user[0]);
    });
  } catch (err) {
    console.error(err);
    res.status(400).json("Unable to register user.");
  }
};

module.exports = {
  handleRegister,
};
