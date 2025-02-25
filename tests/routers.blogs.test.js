const supertest = require("supertest");

const { describe, test, after, beforeEach, before } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const Blog = require("../src/sequelize/models/blogs");


const api = supertest(app);
const base_url = "/api/blogs"

const exampleBlog = {
    author: "author",
    title: "title",
    url: "example.com"
}

// create table if does not exist
// also remove all rows if does exist
before(async () => {
    await Blog.sync();
    await Blog.destroy({where: {}});
})

describe("GET blogs", () => {

    beforeEach(async () => {
        await Blog.destroy({where: {}});
    })

    test("Returns empty list when table is empty", async () => {
        const response = await api.get(base_url);
        assert.strictEqual(response.body.length, 0)
    });

});