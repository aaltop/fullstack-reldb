const express = require("express");
const morgan = require("morgan");

const blogsRouter = require("./routers/blogs");


const app = express();
    
app.use(express.json());
app.use(morgan("tiny"));
app.use("/api/blogs", blogsRouter);

app.get("/health", (req, res) => {
    res.send("ok");
});

module.exports = app;