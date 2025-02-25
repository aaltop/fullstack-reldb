const { describe, test, after, beforeEach, before } = require("node:test");
const assert = require("node:assert");

const sequelize = require("../src/sequelize/connection");


test("Successful sequelize authentication", async () => {
    await sequelize.authenticate();
});