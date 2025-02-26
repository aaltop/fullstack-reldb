const express = require("express");

const Blog = require("../../sequelize/models/blogs");


const router = express.Router();

router.route("/")
    .get(async (req, res) => {
        const blogs = await Blog.findAll();
        res.status(200).json(blogs.map(model => {
            return model.toJSON();
        }));
    })
    .post(async (req, res, next) => {

        try {
            const newBlog = await Blog.create(req.body);
            res.status(200).json(newBlog.toJSON());
        } catch (error) {
            next(error);
        }
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
    })
    .put(async (req, res, next) => {
        const { id } = req.params;
        const { likes } = req.body;

        const blog = await Blog.findByPk(id);
        if (!blog) {
            res.status(404).end();
        } else {
            try {
                await blog.set("likes", likes).save();
                res.status(200).json({ likes });
            } catch (error) {
                next(error);
            }
        }
    });


module.exports = router;