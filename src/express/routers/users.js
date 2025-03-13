const express = require("express");
const bcrypt = require("bcryptjs");

const { errorCatchWrapper } = require("../utils");
const { User, Blog, ReadingList } = require("../../sequelize/models.js");
const { checkPassword } = require("../../utils/validation/string");


const router = express.Router();


router.route("/")
    .get(errorCatchWrapper(async (req, res) => {
        const users = await User.findAll({
            include: [
                {
                    model: Blog,
                    attributes: ["title", "author", "url", "likes", "year"],
                }
            ],
            attributes: { exclude: "passwordHash" },
        });

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

        delete newUser.passwordHash;
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
        const modifiedUser = (await user.save()).toJSON();
        delete modifiedUser.passwordHash;
        res.json(modifiedUser);
    }));

router.route("/:id")
    .get(errorCatchWrapper(async (req, res) => {
        const { id } = req.params;

        const user = await User.findByPk(
            id,
            {
                attributes: [
                    "name",
                    "username"
                ],
                include: {
                    model: ReadingList,
                    attributes: ["blogId"],
                    include: {
                        model: Blog,
                        attributes: [
                            "id",
                            "url",
                            "title",
                            "author",
                            "likes",
                            "year"
                        ]
                    }
                }
            }
        );
        if (!user) return res.status(404).json({ error: "No user with given id" });

        const jsonUser = user.toJSON();
        jsonUser.readingLists = jsonUser.readingLists.map(val => {
            return val.blog;
        });
        res.status(200).json(jsonUser);
    }))

module.exports = router;