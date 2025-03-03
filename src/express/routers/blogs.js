const express = require("express");

const { Blog, User } = require("../../sequelize/models.js");
const { errorCatchWrapper } = require("../utils");
const { usernameFromBearerString } = require("../utils.js");


const router = express.Router();

router.route("/")
    .get(errorCatchWrapper(async (req, res) => {
        const blogs = await Blog.findAll();
        res.status(200).json(blogs.map(model => {
            return model.toJSON();
        }));
    }))
    .post(errorCatchWrapper(async (req, res) => {
        const bearerResult = usernameFromBearerString(req.header("Authorization"));
        if (bearerResult.error) throw bearerResult.error;
        
        const user = await User.findOne({ where: { username: bearerResult.username }});
        if (!user) return res.status(400).json({ error: "No user matches given token" });

        const newBlog = await Blog.create({ ...req.body, UserId: user.id });
        res.status(200).json(newBlog.toJSON());
    }));

router.route("/:id")
    .delete(errorCatchWrapper(async (req, res) => {
        const { id } = req.params;

        const foundBlog = await Blog.findByPk(id);
        
        if (!foundBlog) {
            res.status(404).end();
        } else {
            foundBlog.destroy();
            res.status(204).end();
        }
    }))
    .put(errorCatchWrapper(async (req, res) => {
        const { id } = req.params;
        const { likes } = req.body;

        const blog = await Blog.findByPk(id);
        if (!blog) {
            res.status(404).end();
        } else {
            await blog.set("likes", likes).save();
            res.status(200).json({ likes });
        }
    }));


module.exports = router;