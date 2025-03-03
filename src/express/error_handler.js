const express = require("express");

const sequelizeHandler = require("./error_handlers/sequelize.js");
const jwtHandler = require("./error_handlers/jwt.js");

function catchAll(err, req, res, next)
{
    res.status(500).send("Something went wrong.");
    console.log("Express error:", err);
}

module.exports = [
    sequelizeHandler,
    jwtHandler,
    catchAll
];