const jwt = require("jsonwebtoken");


function errorHandler(error, req, res, next)
{
    if (error instanceof jwt.JsonWebTokenError) {
        if (error.message.includes("jwt must be provided")) {
            return res.status(401).json({ error: "No proper bearer token provided"});
        } else if (error.message.includes("invalid signature")) {
            return res.status(401).json({ error: "Invalid token provided" });
        }
    }

    // should return before this if it is to be handled here
    next(error);
}

module.exports = errorHandler;