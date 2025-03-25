const express = require("express");

const { User, Session } = require("../../sequelize/models.js");
const { errorCatchWrapper } = require("../utils");
const { findUser } = require("../utils.js");

const router = express.Router();


router.route("/")
    .delete(errorCatchWrapper(async (req, res) => {
        const { all } = req.body;
        if (!(all === true || all === false)) {
            return res.status(400).json({ error: "body should be either { all: false } or { all: true }"});
        }

        const userOrStatus = await findUser(req);
        if (userOrStatus.status) return userOrStatus.status;

        let uuid;
        if (!all) uuid = userOrStatus.uuid;
        await Session.deleteSession(userOrStatus.user.username, uuid);
        
        return res.status(204).end();
    }));


module.exports = router;