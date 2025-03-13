const express = require("express");

const { Blog, User, ReadingList } = require("../../sequelize/models.js");
const { errorCatchWrapper, findUser } = require("../utils.js");

const router = express.Router();

router.route("/")
    .post(errorCatchWrapper(async (req, res) => {
        const { userId, blogId } = req.body;

        const foundBlog = await Blog.findByPk(blogId);
        if (!foundBlog) return res.status(400).json({ error: "invalid blog id" });

        const foundUser = await User.findByPk(userId);
        if (!foundUser) return res.status(400).json({ error: "invalid user id" });

        await ReadingList.create({ userId, blogId });
        return res.status(200).end();
    }));

router.route("/:id")
    .post(errorCatchWrapper(async (req, res) => {
        const { id } = req.params;
        const { read } = req.body;
        if (!(read === true)) {
            return res.status(400).json({ error: "'read' in body should be the true boolean"});
        }

        const userOrStatus = await findUser(req);
        console.log("Found user with header", req.header("Authorization"));
        if (userOrStatus.status) return userOrStatus.status;

        const list = await ReadingList.findByPk(id);
        if (!list) return res.status(404).json({ error: "Invalid readingLists id" });

        list.set("read", true);
        await list.save();
        return res.status(200).end();
    }));

module.exports = router;