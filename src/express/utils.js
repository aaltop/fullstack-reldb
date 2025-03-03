const { Request, RequestHandler} = require("express");

const { parseBearerString } = require("../utils/http.js");
const { verifyToken } = require("../utils/jwt.js");

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

module.exports = {
    errorCatchWrapper,
    payloadFromBearerString,
    usernameFromBearerString
};