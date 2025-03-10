require("dotenv").config();

const sequelize = require("./src/sequelize/connection.js");
const { upAll } = require("./src/sequelize/migrations.js");
const app = require("./src/app.js");

async function main()
{
    try {
        console.log("Testing Sequelize connection...");
        await sequelize.authenticate();

        console.log("\nPerforming migrations...");
        const migrations = await upAll();
        console.log("Run migrations:", migrations);
    } catch (error) {
        console.log("Sequelize connection error:", error);
    }
    
    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`\nListening at http://localhost:${port}`)
    });

};

main();
