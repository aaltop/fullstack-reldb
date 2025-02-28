const express = require("express");
const bcrypt = require("bcryptjs");

const { errorCatchWrapper } = require("../utils");
const User = require("../../sequelize/models/users");
const { checkPassword } = require("../../utils/validation/string");


const router = express.Router();


router.route("/")
    .get(errorCatchWrapper(async (req, res) => {
        const users = await User.findAll();

        res.json(users.map(user => user.toJSON()));
    }))
    .post(errorCatchWrapper(async (req, res) => {
        const { name, username, password } = req.body;

        if (password.length < 12 || password.length > 64) {
            return res.status(400).json({ error: "Password should be of length between 12 and 64"});
        }else if (checkPassword(password)) {
            return res.status(400).json({ error: "Password should only contain ASCII letters, numbers, and symbols"});
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = { name, username, passwordHash: hash };
        await User.create(newUser);

        res.json(newUser);
    }));


router.route("/:username")
    .put(errorCatchWrapper(async (req, res) => {
        const { username: usernameToChange } = req.params;
        const { username: newUsername } = req.body;

        if (!(typeof newUsername === "string")) return res.status(400).json({ error: "New username should be sent in the body" });
        // upsert might also work? but there arguments don't really
        // seem to match what's needed here
        const user = await User.findOne({ where: { username: usernameToChange }});
        if (!user) return res.status(404).end();

        user.set("username", newUsername);
        const modifiedUser = await user.save();
        res.json(modifiedUser);
    }))

module.exports = router;