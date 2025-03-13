const { DataTypes } = require("sequelize");

const sequelize = require("../connection");
const { Blog } = require("../models/blogs.js");
const { User } = require("../models/users.js");

const attributes = [
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: User, key: "id" }
        },
        blogId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Blog, key: "id" }
        },
        read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }
];

const ReadingList = sequelize.define(
    "readingList",
    Object.assign({}, ...attributes),
    {
        underscored: true
    }
);

module.exports = { ReadingList, attributes };