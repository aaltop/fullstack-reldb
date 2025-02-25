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

// create table
before(async () => {
    await Blog.sync({force: true});
})

describe("GET blogs", () => {

    beforeEach(async () => {
        await Blog.destroy({where: {}});
    })

    test("Returns empty list when table is empty", async () => {
        const response = await api.get(base_url);
        assert.strictEqual(response.body.length, 0)
    });

    test("Returns list of one with one blog", async () => {
        await Blog.create(exampleBlog);

        const response = await api.get(base_url);
        assert.strictEqual(response.body.length, 1);
    });

    test("Returns correct information", async () => {
        await Blog.create(exampleBlog);

        const response = await api.get(base_url);

        const { author, title, url, likes } = response.body[0];

        assert.deepStrictEqual(
            { ...exampleBlog, likes: 0 },
            { author, title, url, likes }
        );
    });

});