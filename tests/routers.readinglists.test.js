const supertest = require("supertest");

const { describe, test, after, beforeEach, before, afterEach } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const { Blog, User, ReadingList } = require("../src/sequelize/models.js");
const { getSettledError } = require("../src/utils/promise.js");
const { forceSync } = require("../src/sequelize/migrations.js");

const api = supertest(app);
const baseUrl = "/api/readinglists";

const existingExampleUser = {
    name: "Dave Example",
    username: "DaveyBoy@DavesSite.com",
    passwordHash: "exampleHash"
};

let token = null;
const newExampleBlog = {
    author: "author Bloke",
    title: "This is a title",
    url: "example.com",
    year: (new Date()).getFullYear()
};
let exampleBlog = null;
let exampleReading = null;
// create tables, set dummy data
before(async () => {
    await forceSync();
    const createdUser = await User.create(existingExampleUser);
    exampleBlog = {
        ...newExampleBlog,
        UserId: createdUser.id
    };
    const createdBlog = await Blog.create(exampleBlog);
    exampleReading = {
        userId: createdUser.id,
        blogId: createdBlog.id
    };
});

describe("POST readinglists", () => {

    beforeEach(async () => {
        await ReadingList.destroy({ where: {} });
    });

    test("Adds one row to readings list table", async () => {
        const startNum = await ReadingList.count();
        await api.post(baseUrl)
            .send(exampleReading)
            .expect(200);
        
        const endNum = await ReadingList.count();

        assert.strictEqual(endNum-startNum, 1);
    });

    test("Cannot add the same user and blog twice", async () => {
        await api.post(baseUrl)
            .send(exampleReading)
            .expect(200);
        
            await api.post(baseUrl)
            .send(exampleReading)
            .expect(400);
    });

    test("Returns 400 for nonexistent user or blog", async () => {

        const invalidReadings = [
            { ...exampleReading, userId: exampleReading.userId+1},
            { ...exampleReading, blogId: exampleReading.blogId+1},
            { userId: exampleReading.userId+1, blogId: exampleReading.blogId+1}
        ]

        const settled = await Promise.allSettled(invalidReadings.map(val => {
            return api.post(baseUrl)
                .send(val)
                .expect(400);
        }));

        const settledError = getSettledError(settled, invalidReadings);
        if (settledError.rejections) throw new Error(settledError.rejectReason);
    });

    test("Returns 400 for missing values in sent info", async () => {
        const invalidReadings = [
            undefined,
            null,
            {},
            { userId: exampleReading.userId },
            { blogId: exampleReading.blogId },
        ]

        const settled = await Promise.allSettled(invalidReadings.map(val => {
            return api.post(baseUrl)
                .send(val)
                .expect(400);
        }));

        const settledError = getSettledError(settled, invalidReadings);
        if (settledError.rejections) throw new Error(settledError.rejectReason);
    })
})