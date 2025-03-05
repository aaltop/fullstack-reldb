const express = require("express");

const { Blog, User } = require("../../sequelize/models.js");
const { errorCatchWrapper } = require("../utils");
const { usernameFromBearerString } = require("../utils.js");


const router = express.Router();

async function findUser(req)
{
    const bearerResult = usernameFromBearerString(req.header("Authorization"));
    if (bearerResult.error) throw bearerResult.error;
    
    const user = await User.findOne({ where: { username: bearerResult.username }});
    let status = undefined;
    if (!user) status = res.status(400).json({ error: "No user matches given token" });
    return { user, status };
}

router.route("/")
    .get(errorCatchWrapper(async (req, res) => {
        const blogs = await Blog.findAll();
        res.status(200).json(blogs.map(model => {
            return model.toJSON();
        }));
    }))
    .post(errorCatchWrapper(async (req, res) => {
        userOrStatus = await findUser(req);

        if (userOrStatus.status) return userOrStatus.status;
        
        const user = userOrStatus.user;
        const newBlog = await Blog.create({ ...req.body, UserId: user.id });
        res.status(200).json(newBlog.toJSON());
    }));

router.route("/:id")
    .delete(errorCatchWrapper(async (req, res) => {
        const { id } = req.params;
        userOrStatus = await findUser(req);
        if (userOrStatus.status) return userOrStatus.status;
        const user = userOrStatus.user;

        const foundBlog = await Blog.findByPk(id);
        
        if (!foundBlog) {
            return res.status(404).json({ error: "Nonexistent blog id" });
        } else if (foundBlog.UserId !== user.id) {
            return res.status(401).json({ error: "User does not match blog" });
        } else {
            foundBlog.destroy();
            return res.status(204).end();
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