const express = require("express");
const bcrypt = require("bcryptjs");
const { signPayload } = require("../../utils/jwt.js");
const { ValidationError } = require("sequelize");

const { User, Session } = require("../../sequelize/models.js");
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

        const token = signPayload({ username });
        try {
            await Session.create({
                username: username
            });
        } catch (error) {
            if ( // if session with username already exists, ignore
                error instanceof ValidationError
                && error.errors.length === 1
                && error.errors[0].message.includes("username must be unique")
            ) { } else {
                throw error;
            }
        }
        res.json({ token });
    }));


module.exports = router;