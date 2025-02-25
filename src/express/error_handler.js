const express = require("express");

const sequelizeHandler = require("./error_handlers/sequelize");

function catchAll(err, req, res, next)
{
    res.status(500).send("Something went wrong.");
    console.log("Express error:", err);
}

module.exports = [
    sequelizeHandler,
    catchAll
];