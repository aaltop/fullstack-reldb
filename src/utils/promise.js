

/**
 * For all rejected promises in `settledPromises`, create a message
 * `rejectReason` that combines the error messages.
 * 
 * `otherArray` Should be the same length as `settledPromises` and contain
 * JSON.stringify()-able values. These will be used to annotate each
 * rejection message, should there be any, by matching indices between the two arrays.
 * @param {PromiseSettledResult<T>[]} settledPromises 
 * @param {Object[]} otherArray
 * @returns {{ rejections: boolean, rejectReason: string }} `rejections` is
 * set to true if there are any rejections. `rejectReason` is either
 * an empty string, or a string of the rejection messages.
 */
function getSettledError(settledPromises, otherArray)
{
    if (!otherArray) {
        otherArray = settledPromises.map((_, idx) => idx);
    }
    let rejections = false;
    const rejectReason = settledPromises.reduce((prev, cur, idx) => {
        let newVal = prev;
        if (cur.reason) {
            newVal += `\n${JSON.stringify(otherArray[idx])}: ${cur.reason.message}`;
            rejections = true;
        }
        return newVal;
    }, "");

    return {
        rejections,
        rejectReason
    }
}

module.exports = {
    getSettledError
}