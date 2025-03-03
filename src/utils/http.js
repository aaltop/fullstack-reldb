

/**
 * Create a Bearer authentication string in the format "Bearer \<token\>"
 * @param {string} token
 * @returns {string | null} The bearer string if token is a valid string,
 * otherwise null.
 */
function createBearerString(token)
{
    if (!(typeof token === "string")) return null;
    return `Bearer ${token}`;
}

/**
 * Parse the token from `bearerString`.
 * @param {string} bearerString Expected format is "Bearer \<token\>"
 * @returns {string | null} String if `bearerString` can be parsed for
 * a token, otherwise null.
 */
function parseBearerString(bearerString)
{
    try {
        const [start, token] = bearerString.split(" ");
        if (start !== "Bearer" | !token) return null;
        return token;
    } catch (error) {
        return null;
    }
}


module.exports = {
    createBearerString,
    parseBearerString
}