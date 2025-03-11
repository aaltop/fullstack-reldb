const express = require("express");

const sequelizeHandler = require("./error_handlers/sequelize.js");
const jwtHandler = require("./error_handlers/jwt.js");

function catchAll(err, req, res, next)
{
    console.log("Express error:", err);
    return res.status(500).send("Something went wrong.");
}

module.exports = [
    sequelizeHandler,
    jwtHandler,
    catchAll
];