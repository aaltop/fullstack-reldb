const jwt = require("jsonwebtoken");


function errorHandler(error, req, res, next)
{
    if (error instanceof jwt.JsonWebTokenError) {
        if (error.message.includes("jwt must be provided")) {
            return res.status(401).json({ error: "No proper bearer token provided"})
        }
    } else {
        next(error)
    }
}

module.exports = errorHandler;