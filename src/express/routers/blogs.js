const express = require("express");
const { Op } = require("sequelize");

const { Blog, User } = require("../../sequelize/models.js");
const { errorCatchWrapper, findUser} = require("../utils");


const router = express.Router();

function modelToJSON(blogModel)
{
    const retModel = blogModel.toJSON();
    const { name, username } = retModel.user;
    retModel.user = { name, username };
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

        const blogs = await Blog.findAll({
            include: User,
            where,
            order: [["likes", "DESC"]]
        });
        res.status(200).json(blogs.map(modelToJSON));
    }))
    .post(errorCatchWrapper(async (req, res) => {
        userOrStatus = await findUser(req);

        if (userOrStatus.status) return userOrStatus.status;
        
        const user = userOrStatus.user;
        const newBlog = await Blog.create({ ...req.body, userId: user.id });
        // seems to be the most sensible, least faff way of including User
        res.status(200).json(modelToJSON(await Blog.findByPk(newBlog.id, { include: User })));
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
        } else if (foundBlog.userId !== user.id) {
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