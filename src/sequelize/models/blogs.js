const { DataTypes, ValidationError } = require("sequelize");

const sequelize = require("../connection");
const { User } = require("./users.js");

const attributes = [
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        author: {
            type: DataTypes.TEXT,
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                isUrl: true
            }
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        likes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                isInt: val => {
                    // a float will actually be converted to an integer,
                    // so those are also fine if they pass here, just don't want strings
                    if (!Number.isSafeInteger(val)) {
                        throw new Error("Blog.likes should be an integer");
                    };
                },
            }
        },
    },
];

const Blog = sequelize.define(
    "Blog",
    Object.assign({}, ...attributes),
    {
        underscored: true
    }
);

module.exports = { Blog, attributes };