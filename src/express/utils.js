const { Request, RequestHandler } = require("express");

const { parseBearerString } = require("../utils/http.js");
const { verifyToken } = require("../utils/jwt.js");
const { User, Session } = require("../sequelize/models.js");

/**
 * Wraps an express RequestHandler with a try...catch that will
 * call next(error) should an error occur. 
 * The passed RequestHandler should accept (req, res).
 * @param {RequestHandler} handler 
 * @returns {RequestHandler}
 */
function errorCatchWrapper(handler)
{
    return async (req, res, next) => {
        try {
            await handler(req, res);
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Parse a Bearer Authorization header for a token and attempt
 * to verify it.
 * @param {string} bearerString
 * @returns { { payload: object | undefined, error: Error | undefined } }
 * Payload if successful, otherwise an error.
 */
function payloadFromBearerString(bearerString)
{
    try {
        const token = parseBearerString(bearerString);
        const payload = verifyToken(token);
        return { payload };
    } catch (error) {
        return { error }
    }
}

/**
 * Get username string from decoded Authorization Bearer token.
 * @param {string} bearerString 
 * @returns {{ username: string | undefined, error: Error | undefined }}
 * 
 */
function usernameFromBearerString(bearerString)
{
    const ret = payloadFromBearerString(bearerString);
    if (ret.error) return ret;
    const username = ret.payload.username;
    // do a little verification of the content?
    if (typeof username !== "string") {
        return { error: new Error("Invalid authorization header token, username was not a string") }
    } else {
        return { username }
    }
}

function uuidFromBearerString(bearerString)
{
    const ret = payloadFromBearerString(bearerString);
    if (ret.error) return ret;
    const uuid = ret.payload.uuid;
    // do a little verification of the content?
    if (typeof uuid !== "string") {
        return { error: new Error("Invalid authorization header token, uuid was not a string") }
    } else {
        return { uuid }
    }
}

/**
 * Find a user based on the Authorization header's token. Return either
 * the user or a status.
 * @param {Request} req
 * @returns 
 * status: 400 if no matching user, 401 if user has no valid session.
 */
async function findUser(req)
{
    const usernameResult = usernameFromBearerString(req.header("Authorization"));
    if (usernameResult.error) throw usernameResult.error;

    const uuidResult = uuidFromBearerString(req.header("Authorization"));
    if (uuidResult.error) throw uuidResult.error;
    
    let status = undefined;
    const res = req.res;
    if (!(await Session.isValidSession(usernameResult.username, uuidResult.uuid))) {
        status = res.status(401).json({ error: "No valid session found for user" });
        return { user: null, status }
    }
    const user = await User.findOne({ where: { username: usernameResult.username }});
    if (!user) status = res.status(400).json({ error: "No user matches given token" });
    return { user, status };
}

module.exports = {
    errorCatchWrapper,
    payloadFromBearerString,
    usernameFromBearerString,
    findUser
};