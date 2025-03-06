const express = require("express");
const { Op } = require("sequelize");

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

function modelToJSON(blogModel)
{
    const retModel = blogModel.toJSON();
    const { name, username } = retModel.User;
    retModel.user = { name, username };
    delete retModel.User;
    return retModel;
}

router.route("/")
    .get(errorCatchWrapper(async (req, res) => {

        let where = {};
        if (req.query.search) {
            const op = { [Op.iLike]: `%${req.query.search}%` };
            where = {
                [Op.or]: {
                    title: op,
                    author: op
                }
            };
        }

        const blogs = await Blog.findAll({ include: "User", where });
        res.status(200).json(blogs.map(modelToJSON));
    }))
    .post(errorCatchWrapper(async (req, res) => {
        userOrStatus = await findUser(req);

        if (userOrStatus.status) return userOrStatus.status;
        
        const user = userOrStatus.user;
        const newBlog = await Blog.create({ ...req.body, UserId: user.id });
        // seems to be the most sensible, least faff way of including User
        res.status(200).json(modelToJSON(await Blog.findByPk(newBlog.id, { include: "User" })));
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