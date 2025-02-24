const express = require("express");

const Blog = require("../sequelize/models/blogs");


const router = express.Router();

router.route("/")
    .get(async (req, res) => {
        const blogs = await Blog.findAll();
        res.status(200).json(blogs.map(model => {
            model.set("likes", parseInt(model.get("likes")));
            return model.toJSON();
        }));
    })
    .post(async (req, res) => {
        const newBlog = await Blog.create(req.body);
        res.status(200).json(newBlog.toJSON());
    })

router.route("/:id")
    .delete(async (req, res) => {
        const { id } = req.params;

        const foundBlog = await Blog.findByPk(id);
        
        if (!foundBlog) {
            res.status(404).end();
        } else {
            foundBlog.destroy();
            res.status(204).end();
        }
    });


module.exports = router;