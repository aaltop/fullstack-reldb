const { DataTypes } = require("sequelize");

const sequelize = require("../connection");

const Blog = sequelize.define(
    "Blog",
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
            allowNull: false
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        likes: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        underscored: true
    }
);

module.exports = Blog;