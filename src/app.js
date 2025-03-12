const express = require("express");
const morgan = require("morgan");

const blogsRouter = require("./express/routers/blogs.js");
const errorHandler = require("./express/error_handler.js");
const usersRouter = require("./express/routers/users.js");
const loginRouter = require("./express/routers/login.js");
const authorsRouter = require("./express/routers/authors.js");
const readinglistsRouter = require("./express/routers/readingslists.js")


const app = express();
    
app.use(express.json());
app.use(morgan("tiny"));
app.use("/api/blogs", blogsRouter);
app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);
app.use("/api/authors", authorsRouter);
app.use("/api/readinglists", readinglistsRouter);

app.get("/health", (req, res) => {
    res.send("ok");
});

app.use(errorHandler);

module.exports = app;