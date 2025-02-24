const express = require("express");

const Blog = require("../sequelize/models/blogs");


const router = express.Router();

router.route("/")
    .get(async (req, res) => {
        const blogs = await Blog.findAll();
        res.status(200).json(blogs.map(model => model.toJSON()));
    })



module.exports = router;