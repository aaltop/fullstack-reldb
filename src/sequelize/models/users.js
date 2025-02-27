const { DataTypes } = require("sequelize");

const sequelize = require("../connection");
const { checkUsername } = require("../../utils/validation/string");



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
                validateUsername: username => {
                    if (username.length < 8 || username.length > 30) {
                        throw new Error("Username should be of length between 8 and 30");
                    } else if (checkUsername(username)) {
                        throw new Error("Username should only contain ASCII letters and numbers");
                    }
                }
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