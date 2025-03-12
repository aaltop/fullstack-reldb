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
        UserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: User, key: "id" }
        },
        BlogId: {
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
    "ReadingList",
    Object.assign({}, ...attributes),
    {
        underscored: true
    }
);

module.exports = { ReadingList, attributes };