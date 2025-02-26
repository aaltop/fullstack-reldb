const supertest = require("supertest");

const { describe, test, after, beforeEach, before, afterEach } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const Blog = require("../src/sequelize/models/blogs");
const sequelize = require("../src/sequelize/connection");

const api = supertest(app);
const base_url = "/api/blogs";

const exampleBlog = {
    author: "author Bloke",
    title: "This is a title",
    url: "example.com"
};

// create table
before(async () => {
    await Blog.sync({force: true});
});

describe("GET blogs", () => {

    beforeEach(async () => {
        await Blog.destroy({where: {}});
    });

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
            { author, title, url, likes },
            { ...exampleBlog, likes: 0 }
        );
    });

});

describe("POST blog", () => {

    beforeEach(async () => {
        await Blog.destroy({where: {}});
    });

    test("Adds one blog", async () => {

        const startNum = await Blog.count({where: {}});

        const response = await api.post(base_url)
            .send(exampleBlog);

        const endNum = await Blog.count({where: {}});
        assert.strictEqual(endNum, startNum+1);
    });

    test("Returns blog matching sent blog", async () => {

        const response = await api.post(base_url)
            .send(exampleBlog);
        
        const { author, title, url, likes } = response.body;
        assert.deepStrictEqual(
            { author, title, url, likes },
            { ...exampleBlog, likes: 0 }
        );

    });

    test("Returns 400 for invalid blogs", async () => {

        const invalidBlog = {
            author: {
                firstName: "first",
                lastName: "last"
            },
            title: 100,
            url: [1,2,3]
        };

        async function testPost(sentBlog)
        {
            await api.post(base_url)
            .send(sentBlog)
            .expect(400);
        }

        await testPost({});
        await testPost({...exampleBlog, author: invalidBlog.author});
        await testPost({...exampleBlog, title: invalidBlog.title});
        await testPost({...exampleBlog, url: invalidBlog.url});

    });
});

describe("DELETE blog", () => {

    beforeEach(async () => {
        await Blog.destroy({where: {}});
        await Blog.create(exampleBlog);
    });

    test("Removes one blog", async () => {

        const startNum = await Blog.count({ where: {} });

        const foundBlog = await Blog.findOne();

        await api.delete(`${base_url}/${foundBlog.get("id")}`)
            .expect(204);

        const endNum = await Blog.count({ where: {} });
        assert.strictEqual(endNum, startNum - 1);

    });

    test("Removes matching index", async () => {

        const foundBlog = await Blog.findOne();

        const pk = foundBlog.get("id");

        await api.delete(`${base_url}/${pk}`)
            .expect(204);

        const nullBlog = await Blog.findByPk(pk);
        assert(!nullBlog);

    });

});


describe("PUT likes", () => {

    beforeEach(async () => {
        await Blog.destroy({ where: {} });
        await Blog.create(exampleBlog);
    });

    test("Returns the amount changed to", async () => {

        const blog = await Blog.findOne();
        const pk = blog.get("id");

        const expected = { likes: 3 };
        const response = await api.put(`${base_url}/${pk}`)
            .send(expected)
            .expect(200);

        const actual = response.body;

        assert.deepStrictEqual(actual, expected);

    });

    test("Changes the likes to the sent amount", async () => {

        const blog = await Blog.findOne();
        const pk = blog.get("id");

        const newLikes = 3;
        await api.put(`${base_url}/${pk}`)
            .send({ likes: newLikes })
            .expect(200);

        const endLikes = (await Blog.findByPk(pk)).get("likes");
        assert.strictEqual(endLikes, newLikes);

    });

    test("Returns a 404 for invalid id", async () => {
        const blog = await Blog.findOne();
        const pk = blog.get("id");

        await api.put(`${base_url}/${pk+1}`)
            .send({ likes: 3 })
            .expect(404);
    });

    test("Returns 400 for invalid likes value", async () => {
        const blog = await Blog.findOne();
        const pk = blog.get("id");

        async function testPut(sendValue)
        {
            const url = `${base_url}/${pk}`;
            await api.put(url)
                .send(sendValue)
                .expect(400);
        }

        const tests = [
            testPut(),
            testPut({}),
            testPut({ likes: "3" }),
            testPut("3")
        ];

        await Promise.all(tests);

    });

});