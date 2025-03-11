const supertest = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { describe, test, after, beforeEach, before, afterEach } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const { Blog, User } = require("../src/sequelize/models.js");
const sequelize = require("../src/sequelize/connection");
const { createBearerString } = require("../src/utils/http.js");
const { getSettledError } = require("../src/utils/promise.js");
const mathUtils = require("../src/utils/math.js");
const { forceSync } = require("../src/sequelize/migrations.js");

const api = supertest(app);
const baseUrl = "/api/blogs";

const examplePassword = "AperfectlyV4l!dpassword";
const exampleHash = bcrypt.hashSync(examplePassword, 10);
const existingExampleUser = {
    name: "Dave Example",
    username: "DaveyBoy@DavesSite.com",
    passwordHash: exampleHash
};

function compareActualAndExpected(actual, expectedBlog, expectedUser)
{
    const extraProperties = [
        "createdAt",
        "updatedAt",
        "id"
    ]
    extraProperties.forEach(key => {
        assert(key in actual);
        delete actual[key];
    });

    expectedBlog ??= exampleBlog;
    expectedUser ??= existingExampleUser;

    expected = {
        ...expectedBlog,
        likes: expectedBlog.likes ? expectedBlog.likes : 0,
        user: {
            name: expectedUser.name,
            username: expectedUser.username
        }
    };

    assert.deepStrictEqual(
        actual,
        expected
    );
}

let token = null;
const newExampleBlog = {
    author: "author Bloke",
    title: "This is a title",
    url: "example.com",
    year: (new Date()).getFullYear()
};
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
        ...newExampleBlog,
        UserId: createdUser.id
    };
});

describe("GET blogs", () => {

    beforeEach(async () => {
        await Blog.destroy({where: {}});
    });

    test("Returns empty list when table is empty", async () => {
        const response = await api.get(baseUrl);
        assert.strictEqual(response.body.length, 0)
    });

    test("Returns list of one with one blog", async () => {
        await Blog.create(exampleBlog);

        const response = await api.get(baseUrl);
        assert.strictEqual(response.body.length, 1);
    });

    test("Returns correct information", async () => {
        await Blog.create(exampleBlog);

        const response = await api.get(baseUrl);

        const actual = response.body[0];
        compareActualAndExpected(actual);
    });

    test("Returns blogs sorted in descending order of likes", async () => {

        const blogs = [
            { ...exampleBlog, likes: 100 },
            { ...exampleBlog, likes: 234 },
            { ...exampleBlog, likes: 78 }
        ].concat(Array(7).fill().map(() => {
            // some random values too, a little more robust that way
            return { ...exampleBlog, likes: mathUtils.randInt(0, 300) }
        }));

        const expectedOrder = mathUtils.argSort(blogs, (a,b) => b.likes - a.likes);
        await Promise.all(blogs.map(bl => Blog.create(bl)));
        
        const response = await api.get(baseUrl);
        assert.strictEqual(response.body.length, blogs.length);
        response.body.forEach((expec, idx) => compareActualAndExpected(expec, blogs[expectedOrder[idx]]));
    });

    describe("Search functionality", () => {

        test("Search words bring up relevant items based on title", async () => {
            await Blog.create(exampleBlog);
            await Blog.create({ ...exampleBlog, title: "Something else" });
    
            const response = await api.get(baseUrl)
                .query({
                    search: "this is"
                })
                .expect(200);
    
            assert.strictEqual(response.body.length, 1);
            compareActualAndExpected(response.body[0]);
        });

        test("Search words bring up relevant items based on author name", async () => {
            await Blog.create(exampleBlog);
            const otherBlog = { ...exampleBlog, author: "Dan Abramov" };
            await Blog.create(otherBlog);
    
            const response = await api.get(baseUrl)
                .query({
                    search: "n ab"
                })
                .expect(200);
    
            assert.strictEqual(response.body.length, 1);
            compareActualAndExpected(response.body[0], otherBlog);
        });
    
        test("Search word is case insensitive", async () => {
            await Blog.create(exampleBlog);
            await Blog.create({ ...exampleBlog, title: "Something else" });
    
            const response = await api.get(baseUrl)
                .query({
                    search: "ThIS iS"
                })
                .expect(200);
    
            assert.strictEqual(response.body.length, 1);
            compareActualAndExpected(response.body[0]);
        });

    })


});

describe("POST blog", () => {

    beforeEach(async () => {
        await Blog.destroy({where: {}});
    });

    function postBlog(blog, localToken)
    {
        localToken ??= token;
        return api.post(baseUrl)
            .set("authorization", createBearerString(localToken))
            .send(blog);
    }

    test("Adds one blog", async () => {

        const startNum = await Blog.count({where: {}});
        
        const response = await postBlog(newExampleBlog).expect(200);

        const endNum = await Blog.count({where: {}});
        assert.strictEqual(endNum, startNum+1);
    });

    test("Returns blog matching sent blog", async () => {

        const response = await postBlog(newExampleBlog).expect(200);
        
        const actual = response.body;
        compareActualAndExpected(actual);

    });

    test("Returns 400 for invalid blogs", async () => {

        const invalidBlog = {
            author: {
                firstName: "first",
                lastName: "last"
            },
            title: 100,
            url: [1,2,3],
        };

        async function testPost(sentBlog)
        {
            await postBlog(sentBlog).expect(400);
        }

        const invalidYears = [
            1776,
            1990,
            1991.11111,
            2030,
            (new Date()).getFullYear()+1,
            null,
            undefined,
            "2000"
        ];
        const invalidBlogs = [
            {},
            {...newExampleBlog, author: invalidBlog.author},
            {...newExampleBlog, title: invalidBlog.title},
            {...newExampleBlog, url: invalidBlog.url},
        ].concat(invalidYears.map(year => {
            return { ...newExampleBlog, year }
        }));

        const settled = await Promise.allSettled(invalidBlogs.map(blog => testPost(blog)));
        const settledError = getSettledError(
            settled,
            [
                "empty object",
                invalidBlog.author,
                invalidBlog.title,
                invalidBlog.url,
                invalidBlog.UserId,
            ].concat(invalidYears)
        );

        if (settledError.rejections) throw new Error(settledError.rejectReason);

    });

    test("Returns 401 for invalid tokens or missing auth", async () => {

        await api.post(baseUrl).send(newExampleBlog).expect(401);

        
        const invalidValues = [
            1,
            1.4,
            [1,2,3],
            { some: "value" },
            null,
            undefined,
            jwt.sign({ username: "some@user.com" }, "1234321SomesecretstringAAA", { noTimestamp: true })
        ];

        const result = await Promise.allSettled(invalidValues.map(val => {
            if (!val) {
                // sending null and undefined too, otherwise they
                // get replaced by the actual token
                return api.post(baseUrl)
                    .set("authorization", createBearerString(val))
                    .send(newExampleBlog)
                    .expect(401);
            }
            return postBlog(newExampleBlog, val).expect(401);
        }));

        const settledError = getSettledError(result, invalidValues);

        if (settledError.rejections) throw new Error(settledError.rejectReason);

    });
});

describe("DELETE blog", () => {

    beforeEach(async () => {
        await Blog.destroy({where: {}});
        await Blog.create(exampleBlog);
    });

    function deleteBlog(id, localToken)
    {
        localToken ??= token;
        return api.delete(`${baseUrl}/${id}`)
            .set("authorization", createBearerString(localToken));
    }

    test("Removes one blog", async () => {

        const startNum = await Blog.count({ where: {} });

        const foundBlog = await Blog.findOne();

        await deleteBlog(foundBlog.id).expect(204);

        const endNum = await Blog.count({ where: {} });
        assert.strictEqual(endNum, startNum - 1);

    });

    test("Removes matching index", async () => {

        const foundBlog = await Blog.findOne();
        const id = foundBlog.get("id");

        await deleteBlog(id).expect(204);

        const nullBlog = await Blog.findByPk(id);
        assert(!nullBlog);

    });

    test("Returns 401 for invalid tokens or missing auth", async () => {

        const foundBlog = await Blog.findOne();
        const id = foundBlog.get("id");

        const invalidValues = [
            1,
            1.4,
            [1,2,3],
            { some: "value" },
            null,
            undefined,
            jwt.sign({ username: "some@user.com" }, "1234321SomesecretstringAAA", { noTimestamp: true })
        ];

        const promises = [api.delete(`${baseUrl}/${id}`).expect(401)].concat(invalidValues.map(val => {
            if (!val) {
                // sending null and undefined too, otherwise they
                // get replaced by the actual token
                return api.delete(`${baseUrl}/${id}`)
                    .set("authorization", createBearerString(val))
                    .expect(401);
            }
            return deleteBlog(id, val).expect(401);
        }));
        const result = await Promise.allSettled(promises);

        const settledError = getSettledError(result, ["no auth"].concat(invalidValues));
        if (settledError.rejections) throw new Error(settledError.rejectReason);

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
        const response = await api.put(`${baseUrl}/${pk}`)
            .send(expected)
            .expect(200);

        const actual = response.body;

        assert.deepStrictEqual(actual, expected);

    });

    test("Changes the likes to the sent amount", async () => {

        const blog = await Blog.findOne();
        const pk = blog.get("id");

        const newLikes = 3;
        await api.put(`${baseUrl}/${pk}`)
            .send({ likes: newLikes })
            .expect(200);

        const endLikes = (await Blog.findByPk(pk)).get("likes");
        assert.strictEqual(endLikes, newLikes);

    });

    test("Returns a 404 for invalid id", async () => {
        const blog = await Blog.findOne();
        const pk = blog.get("id");

        await api.put(`${baseUrl}/${pk+1}`)
            .send({ likes: 3 })
            .expect(404);
    });

    test("Returns 400 for invalid likes value", async () => {
        const blog = await Blog.findOne();
        const pk = blog.get("id");

        async function testPut(sendValue)
        {
            const url = `${baseUrl}/${pk}`;
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