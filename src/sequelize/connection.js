require('dotenv').config();
const { Sequelize } = require('sequelize');

let url;

const node_env = process.env.NODE_ENV;

if (node_env === "production") {
    url = process.env.DATABASE_URL;
} else if (node_env === "development") {
    url = process.env.DEV_DATABASE_URL;
} else {
    url = process.env.TEST_DATABASE_URL;
};

const sequelize = new Sequelize(url);

module.exports = sequelize;