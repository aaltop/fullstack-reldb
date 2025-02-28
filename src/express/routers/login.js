const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../sequelize/models/users");
const { errorCatchWrapper } = require("../utils");
const env = require("../../utils/env");


const router = express.Router();


router.route("/")
    .post(errorCatchWrapper(async (req, res) => {

        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "username and password must be passed" });
        }

        const user = await User.findOne({ where: { username }});
        if (!user) {
            return res.status(400).json({ error: "username incorrect" });
        }

        const passwordCorrect = await bcrypt.compare(password, user.passwordHash);
        if (!passwordCorrect) {
            return res.status(400).json({ error: "password incorrect" });
        }

        const token = jwt.sign({ username }, env.SECRET);
        res.json({ token });
    }));


module.exports = router;