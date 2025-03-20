const { DataTypes } = require("sequelize");

const sequelize = require("../connection");

const attributes = [
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        validUntil: { // null is no end date
            type: DataTypes.DATE,
        }
    }
];

const Session = sequelize.define(
    "session",
    Object.assign({}, ...attributes),
    {
        underscored: true
    }
);

module.exports = { Session, attributes };