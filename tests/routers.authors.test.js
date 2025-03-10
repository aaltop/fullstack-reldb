const supertest = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { describe, test, after, beforeEach, before, afterEach } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const { Blog, User } = require("../src/sequelize/models.js");
const sequelize = require("../src/sequelize/connection");
const { getSettledError } = require("../src/utils/promise.js");
const mathUtils = require("../src/utils/math.js");
const { forceSync } = require("../src/sequelize/migrations.js");

const api = supertest(app);
const baseUrl = "/api/authors";

const examplePassword = "AperfectlyV4l!dpassword";
const exampleHash = bcrypt.hashSync(examplePassword, 10);
const existingExampleUser = {
    name: "Dave Example",
    username: "DaveyBoy@DavesSite.com",
    passwordHash: exampleHash
};
const exampleAuthors = [
    "Example Author 01",
    "Example Author 02",
    "Example Author 03"
];

let token = null;
let exampleBlog = null;
// create tables, get user token, set UserId in blog
before(async () => {
    await forceSync();

    const createdUser = await User.create(existingExampleUser);
    response = await api.post("/api/login")
        .send({ username: existingExampleUser.username, password: examplePassword })
        .expect(200);

    token = response.body.token;
    assert(typeof token === "string");
    exampleBlog = {
        author: exampleAuthors[0],
        title: "This is a title",
        url: "example.com",
        UserId: createdUser.id
    };
});

describe("GET authors", () => {

    beforeEach(async () => {
        await Blog.destroy({ where: {} });
    });

    async function createBlogs()
    {
        let authorsArray = [];
        await Promise.all(exampleAuthors.map(aut => {
            const numBlogs = mathUtils.randInt(1,4);
            const numLikes = Array(numBlogs).fill().map(() => mathUtils.randInt(10,50));
            const likesSum = numLikes.reduce((prev, cur) => prev+cur);
            // nums returned as strings from sequelize due to potential
            // bigint values which can't be represented in JSON,
            // so reflect that in the expected format
            // not the case across the REST API, though, likes
            // are converted to number elsewhere, but could change that to
            // be the same as here (and ultimately should)
            authorsArray = authorsArray.concat([{ author: aut, articles: numBlogs.toString(), likes: likesSum.toString() }]);
            const blogs = numLikes.map(like => {
                return { ...exampleBlog, author: aut, likes: like };
            });
            return Blog.bulkCreate(blogs, { validate: true });
        }));
        // <string>-<string> does implicit convert to number here
        return authorsArray.toSorted((a,b) => b.likes-a.likes);
    }

    test("Returns empty list for no authors", async () => {
       const response = await api.get(baseUrl).expect(200);
       assert(Array.isArray(response.body));
       assert.strictEqual(response.body.length, 0); 
    });

    test("Returns expected content sorted by likes", async () => {

        const authorsArray = await createBlogs();
        const response = await api.get(baseUrl).expect(200);

        assert.strictEqual(response.body.length, authorsArray.length);
        authorsArray.forEach((val, idx) => {
            assert.deepStrictEqual(response.body[idx], val);
        });
    });

});