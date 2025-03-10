const { downOne } = require("../../src/sequelize/migrations.js");

async function main()
{
    const migrations = await downOne();
    console.log("migrations performed:", migrations);
}

main();