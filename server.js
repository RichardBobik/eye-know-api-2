const express = require('express');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');

const register = require('./controllers/register');
const signIn = require('./controllers/signIn');
const image = require('./controllers/image');
const imageUrl = require('./controllers/imageUrl');

const db = knex({
    client: "pg",
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
});

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("success");
})

app.post("/signIn", (req, res) => { signIn.handleSignIn(req, res, db, bcrypt) });

app.post("/register", (req, res) => { register.handleRegister(req, res, db, bcrypt) });

app.put("/image", (req, res) => { image.handleImage(req, res, db)});

app.post("/imageurl", (req, res) => { imageUrl.handleImageUrl(req, res)});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
