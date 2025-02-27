
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

module.exports = {
    errorCatchWrapper
};