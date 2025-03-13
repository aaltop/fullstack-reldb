const express = require("express");

const { Blog, User, ReadingList } = require("../../sequelize/models.js");
const { errorCatchWrapper } = require("../utils");

const router = express.Router();

router.route("/")
    .post(errorCatchWrapper(async (req, res) => {
        const { userId, blogId } = req.body;

        const foundBlog = await Blog.findByPk(blogId);
        if (!foundBlog) return res.status(400).json({ error: "invalid blog id" });

        const foundUser = await User.findByPk(userId);
        if (!foundUser) return res.status(400).json({ error: "invalid user id"});

        await ReadingList.create({ userId, blogId });
        return res.status(200).end();
    }));

module.exports = router;