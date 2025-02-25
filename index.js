require("dotenv").config();

const sequelize = require("./src/sequelize/connection");
const app = require("./src/app");


async function main()
{
    try {
        console.log("Testing Sequelize connection...");
        await sequelize.authenticate();

        // I guess it technically shouldn't hurt
        // to synchronise in production either
        if (process.env.NODE_ENV !== "production") {
            console.log("\nSynchronizing sequelize...");
            await sequelize.sync();
        }
    } catch (error) {
        console.log("Sequelize connection error:", error);
    }
    
    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`\nListening at http://localhost:${port}`)
    });

};

main();
