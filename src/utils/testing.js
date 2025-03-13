const { getSettledError } = require("./promise.js");

/**
 * Map values in `mapArray` using `mapFunc` and wait for the resulting
 * Promises to be settled, throwing a descriptive error if any Promises are rejected.
 * @param {any[]} mapArray 
 * @param {function(...any): Promise} mapFunc 
 */
async function ensureAllSettled(mapArray, mapFunc)
{
    const settled = await Promise.allSettled(mapArray.map(mapFunc));
    const settledError = getSettledError(settled, mapArray);
    if (settledError.rejections) throw new Error(settledError.rejectReason);
}

module.exports = {
    ensureAllSettled
}