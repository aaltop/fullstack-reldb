const jwt = require("jsonwebtoken");

const env = require("./env.js");

/**
 * 
 * @param {string | Buffer | object } payload 
 * @returns {string}
 */
function signPayload(payload)
{
    return jwt.sign(payload, env.SECRET, { noTimestamp: true });
}

/**
 * 
 * @param {string} token 
 * @returns 
 */
function verifyToken(token)
{
    return jwt.verify(token, env.SECRET);
}


module.exports = {
    signPayload,
    verifyToken
}