const { ValidationError } = require("sequelize");


function errorHandler(error, req, res, next)
{
    if (error instanceof ValidationError) {
        const messages = error.errors.map(item => item.message);
        res.status(400).json(messages);
    } else {
        next(error);
    }
}


module.exports = errorHandler;