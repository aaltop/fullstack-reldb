
const { symbolsString } = require("../regexp");

const passwordReg = new RegExp(`[^\\w${symbolsString}]`);

/**
 * Ensure that `pass` only contains letters, numbers, and symbols.
 * @param {string} pass
 * @returns {boolean} whether `pass` contains any disallowed characters.
 */
function checkPassword(pass)
{
    return passwordReg.test(pass);
}

const userReg = new RegExp(`[^\\w_-]`);

/**
 * Ensure that `user` only contains letters and numbers.
 * @param {string} user
 * @returns {boolean} whether `user` contains any disallowed characters.
 */
function checkUsername(user)
{
    return userReg.test(user);
}

module.exports = {
    checkPassword,
    checkUsername
};