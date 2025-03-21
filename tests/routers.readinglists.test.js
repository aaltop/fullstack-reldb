const supertest = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { describe, test, after, beforeEach, before, afterEach } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const { Blog, User, ReadingList, Session } = require("../src/sequelize/models.js");
const { ensureAllSettled } = require("../src/utils/testing.js");
const { forceSync } = require("../src/sequelize/migrations.js");
const { createBearerString } = require("../src/utils/http.js");
const localJwt = require("../src/utils/jwt.js");

const api = supertest(app);
const baseUrl = "/api/readinglists";

const examplePassword = "AperfectlyV4l!dpassword";
const exampleHash = bcrypt.hashSync(examplePassword, 10);
const existingExampleUser = {
    name: "Dave Example",
    username: "DaveyBoy@DavesSite.com",
    passwordHash: exampleHash
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

async function login(username, password)
{
    const response = await api.post("/api/login")
        .send({ username, password })
        .expect(200);

    return response.body.token;
}

// create tables, set dummy data
before(async () => {
    await forceSync();
    const createdUser = await User.create(existingExampleUser);
    token = await login(existingExampleUser.username, examplePassword);
    assert(typeof token === "string");
    exampleBlog = {
        ...newExampleBlog,
        userId: createdUser.id
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

        await ensureAllSettled(invalidReadings, val => {
            return api.post(baseUrl)
                .send(val)
                .expect(400);
        });
    });

    test("Returns 400 for missing values in sent info", async () => {
        const invalidReadings = [
            undefined,
            null,
            {},
            { userId: exampleReading.userId },
            { blogId: exampleReading.blogId },
        ]

        await ensureAllSettled(invalidReadings, val => {
            return api.post(baseUrl)
                .send(val)
                .expect(400);
        });
    });
});

describe("POST readinglists/:id", () => {
    beforeEach(async () => {
        await ReadingList.destroy({ where: {} });
    });

    function postReadStatus(id, sentData, localToken)
    {
        localToken ??= token;
        return api.post(`${baseUrl}/${id}`)
            .set("authorization", createBearerString(localToken))
            .send(sentData);
    }

    test("Sets as read", async () => {
        const { id, read: startRead } = await ReadingList.create(exampleReading);
        assert(!startRead);
        await postReadStatus(id, { read: true }).expect(200);
        const { read: endRead } = await ReadingList.findByPk(id);
        assert(endRead);
    });

    test("Returns 404 for nonexistent id", async () => {
        // should be nothing in table, so any old id'll do
        await postReadStatus(1, { read: true }).expect(404);
    });

    test("Returns 400 for invalid id", async () => {
        await ReadingList.create(exampleReading);
        const invalidIds = [
            undefined,
            null,
            123.123,
            "hello"
        ];

        await ensureAllSettled(invalidIds, id => {
            return postReadStatus(id, { read: true }).expect(400);
        });
    });

    test("Returns 400 for invalid sent data", async () => {
        const { id } = await ReadingList.create(exampleReading);
        const invalidData = [
            {},
            [],
            [12,3],
            "hello",
            { read: 1 }
        ];

        await ensureAllSettled(invalidData, data => {
            return postReadStatus(id, data).expect(400);
        });
    });

    test("Returns 401 for invalid auth headers", async () => {
        const { id } = await ReadingList.create(exampleReading);
        const invalidTokens = [
            "no auth",
            "basic auth",
            "incorrect formatting",
            1,
            1.4,
            [1,2,3],
            { some: "value" },
            null,
            undefined,
            jwt.sign({ username: "some@user.com" }, "1234321SomesecretstringAAA", { noTimestamp: true })
        ];

        

        await ensureAllSettled(invalidTokens, val => {
            if (val === "no auth") {
                return api.post(`${baseUrl}/${id}`).send({ read: true }).expect(401);
            }
            if (val === "basic auth") {
                return api.post(`${baseUrl}/${id}`)
                    .send({ read: true })
                    .set("authorization", `Basic ${token}`)
                    .expect(401);
            }
            if (val === "incorrect formatting") {
                return api.post(`${baseUrl}/${id}`)
                    .send({ read: true })
                    .set("authorization", `Bearer null`)
                    .expect(401);
            }
            if (!val) {
                return api.post(`${baseUrl}/${id}`)
                    .send({ read: true })
                    .set("authorization", createBearerString(val))
                    .expect(401);
            }
            return postReadStatus(id, { read: true }, val).expect(401);
        })
    });

    test("Returns 401 for invalid server-side session", async () => {
        const { id } = await ReadingList.create(exampleReading);

        const token = await login(existingExampleUser.username, examplePassword);
        const { uuid } = localJwt.verifyToken(token);

        assert.strictEqual(
            await Session.count(
            { where: { username: existingExampleUser.username }}),
            2
        );
        await Session.setAsInvalid(existingExampleUser.username);
        await postReadStatus(id, { read: true }, token).expect(401);
        assert.strictEqual(
            await Session.count(
            { where: { username: existingExampleUser.username }}),
            1
        );
    });
});