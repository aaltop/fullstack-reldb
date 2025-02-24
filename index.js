require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const sequelize = require("./src/sequelize/connection");
const blogsRouter = require("./src/routers/blogs");


async function main()
{
    try {
        console.log("Testing Sequelize connection...");
        await sequelize.authenticate();

        if (process.env.NODE_ENV === "development") {
            console.log("\nSynchronizing sequelize...");
            await sequelize.sync();
        }
    } catch (error) {
        console.log("Sequelize connection error:", error);
    }
    
    const app = express();
    
    app.use(express.json());
    app.use(morgan("tiny"));
    app.use("/api/blogs", blogsRouter);
    
    app.get("/health", (req, res) => {
        res.send("ok");
    });
    
    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`\nListening at http://localhost:${port}`)
    });

};

main();
