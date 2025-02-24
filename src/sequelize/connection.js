require('dotenv').config();
const { Sequelize, QueryTypes} = require('sequelize');


const sequelize = new Sequelize(process.env.DATABASE_URL);

module.exports = sequelize;