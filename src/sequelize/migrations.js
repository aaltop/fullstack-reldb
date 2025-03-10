const {Umzug, SequelizeStorage} = require('umzug');

const sequelize = require("./connection.js");

const umzugConfig = {
  migrations: {glob: 'migrations/*.js'},
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({sequelize, tableName: "migrations"}),
  logger: console,
};

async function upAll()
{
    const umzug = new Umzug(umzugConfig);
    const migrations = await umzug.up();
    return migrations;
}

async function downMultiple(howMany)
{
    const umzug = new Umzug(umzugConfig);
    const migrations = await umzug.down({ step: howMany });
    return migrations;
}

async function downOne()
{
    return await downMultiple(1);
}

async function downAll()
{
    const umzug = new Umzug(umzugConfig);
    const migrations = await umzug.down({ to: 0 });
    return migrations;
}

/**
 * Rollback all migrations, then repeat all migrations.
 */
async function forceSync()
{
    await downAll();
    await upAll();
}

module.exports = {
    upAll,
    downMultiple,
    downOne,
    downAll,
    forceSync
}