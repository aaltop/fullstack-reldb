const express = require("express");
const morgan = require("morgan");

const blogsRouter = require("./express/routers/blogs");
const errorHandler = require("./express/error_handler");
const usersRouter = require("./express/routers/users");


const app = express();
    
app.use(express.json());
app.use(morgan("tiny"));
app.use("/api/blogs", blogsRouter);
app.use("/api/users", usersRouter);

app.get("/health", (req, res) => {
    res.send("ok");
});


app.use(errorHandler);

module.exports = app;