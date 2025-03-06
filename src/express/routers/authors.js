const express = require("express");
const sequelize = require("sequelize");

const { Blog } = require("../../sequelize/models.js");
const { errorCatchWrapper } = require("../utils");

const router = express.Router();

router.route("/")
    .get(errorCatchWrapper(async (req, res) => {
        const blogs = await Blog.findAll({
            attributes: [
                "author",
                [sequelize.fn("SUM", sequelize.col("likes")), "likes"],
                [sequelize.fn("COUNT", sequelize.col("*")), "articles"]
            ],
            group: [["author"]],
            order: [["likes", "DESC"]]
        });

        return res.status(200).json(blogs.map(blog => blog.toJSON()));
    }));

module.exports = router;