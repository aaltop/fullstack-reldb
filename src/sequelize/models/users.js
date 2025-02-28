const { DataTypes } = require("sequelize");

const sequelize = require("../connection");



const User = sequelize.define(
    "User",
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
        underscored: true
    }
);

module.exports = User;