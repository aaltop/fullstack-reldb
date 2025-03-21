const { DataTypes } = require("sequelize");

const sequelize = require("../connection");

const attributes = [
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        username: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        passwordHash: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
    {
        disabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }
];

const User = sequelize.define(
    "user",
    Object.assign({}, ...attributes),
    {
        underscored: true
    }
);

module.exports = { User, attributes };