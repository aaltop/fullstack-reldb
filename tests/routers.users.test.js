const supertest = require("supertest");
const bcrypt = require("bcryptjs");

const { before, beforeEach, describe, test, after } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const { User, Blog, ReadingList } = require("../src/sequelize/models.js");
const { forceSync } = require("../src/sequelize/migrations.js");
const { getSettledError } = require("../src/utils/promise.js");
const { pickProperties } = require("../src/utils/object.js");

const api = supertest(app);


const examplePassword = "AperfectlyV4l!dpassword";
const exampleHash = bcrypt.hashSync(examplePassword, 10);
const exampleUser = {
    name: "Dave Example",
    username: "DaveyBoy@DavesSite.com",
};
const newExampleUser = {
    ...exampleUser,
    password: examplePassword
}
const existingExampleUser = {
    ...exampleUser,
    passwordHash: exampleHash
}
let exampleBlog = {
    author: "author Bloke",
    title: "This is a title",
    url: "example.com",
    year: (new Date()).getFullYear()
};
const baseUrl = "/api/users";

async function createUserAndBlog(user, blog)
{
    const createdUser = await User.create(user);
    const createdBlog = await Blog.create({ ...blog, userId: createdUser.id });
    return { user: createdUser, blog: createdBlog }
}

before(async () => {
    await forceSync();
});

describe("GET users", () => {

    beforeEach(async () => {
        await Blog.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    test("Returns empty list when no users", async () => {

        const response = await api.get(baseUrl)
            .expect(200);

        const users = response.body;
        assert.strictEqual(users.length, 0);

    });

    test("Returns matching user", async () => {

        await createUserAndBlog(existingExampleUser, exampleBlog)

        const response = await api.get(baseUrl)
            .expect(200);

        const users = response.body;
        const actual = users[0];
        const extraProperties = [
            "createdAt",
            "updatedAt",
            "id"
        ]
        extraProperties.forEach(key => {
            assert(key in actual);
            delete actual[key];
        });

        // shouldn't actually have the user id for blogs, as all blogs are
        // from the same user
        expected = { ...exampleUser, blogs: [{ ...exampleBlog, likes: 0 }] }
        assert.deepStrictEqual(actual, expected);
    });

    after(async () => {
        await Blog.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

});

describe("POST users", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
    });

    test("Returns username and name", async () => {

        const response = await api.post(baseUrl)
            .send(newExampleUser)
            .expect(200);

        const { username, name } = response.body;
        assert(!(response.body.passwordHash));
        assert.deepStrictEqual({ username, name }, exampleUser);
    });

    test("Sets createdAt, updatedAt timestamps", async () => {

        const response = await api.post(baseUrl)
            .send(newExampleUser)
            .expect(200);

        const { createdAt, updatedAt } = response.body;
        assert(!createdAt);
        assert.deepStrictEqual(createdAt, updatedAt);

    });

    test("Returns 400 for non-email username", async () => {
        
        const invalidUsernames = [
            "",
            "xXxDaveyBoyxXx",
            3000,
            "https://www.Dave.com",
            "Dave@email",
            null,
            undefined
        ]

        await Promise.all(invalidUsernames.map(async usr => {
            await api.post(baseUrl)
            .send({ ...newExampleUser, username: usr})
            .expect(400);
        }));

    });

    test("Returns 400 for wrong length password (<12, >64)", async () => {
        await api.post(baseUrl)
            .send({ ...newExampleUser, password: "Sh@r7"})
            .expect(400);

        await api.post(baseUrl)
            .send({ ...newExampleUser, password: "To0!"+"o".repeat(64)+"ng"})
            .expect(400);
    });

    test("Returns 400 for password with invalid symbols", async () => {

        // not obviously very easy to be comprehensive about it,
        // so just put a few examples here, at least for now
        const invalidExtensions = [
            " ",
            "\n",
            "\r",
            "\t",
            "ä",
            "Ö"
        ];

        await Promise.all([
            Promise.all(invalidExtensions.map(ext => {
                return api.post(baseUrl)
                    .send({ ...newExampleUser, password: examplePassword+ext })
                    .expect(400);
            })),
            Promise.all(invalidExtensions.map(ext => {
                return api.post(baseUrl)
                    .send({ ...newExampleUser, password: ext+examplePassword })
                    .expect(400);
            }))
        ]);

    });

});

describe("Change username", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });

        // There's some weird overlap between these tests
        // and the above ones, where the last two there (maybe?)
        // seem to cause the first here to fail due to
        // there being a user in the database despite the .destroy
        // here. This should hopefully fix that.
        const num = await User.count({ where: {} });
        if (num !== 0) {
            await User.destroy({ where: {} });
            if (await User.count({ where: {} })) throw new Error("Database not properly initialised");
        }
        await User.create(existingExampleUser);
    });

    test("Changes username", async () => {
        let user = await User.findOne();

        const newUsername = "DaveyMan@DavesSite.com";
        const response = await api.put(`${baseUrl}/${user.username}`)
            .send({ username: newUsername })
            .expect(200);

        user = await User.findByPk(user.id);

        assert.strictEqual(response.body.username, newUsername);
    });

    test("Changes updatedAt timestamp", async () => {

        let user = await User.findOne();

        const oldStamp = user.updatedAt;

        const newUsername = "DaveyMan@DavesSite.com";
        await api.put(`${baseUrl}/${user.username}`)
            .send({ username: newUsername })
            .expect(200);

        user = await User.findByPk(user.id);
        assert(!!oldStamp && !!user.updatedAt);
        assert.notStrictEqual(oldStamp, user.updatedAt);

    });

    test("Returns only the expected information", async () => {
        let user = await User.findOne();

        const newUsername = "DaveyMan@DavesSite.com";
        const response = await api.put(`${baseUrl}/${user.username}`)
            .send({ username: newUsername })
            .expect(200);

        const expectedProperties = [
            "updatedAt",
            "username",
            "name",
            "id",
            "createdAt",
        ].toSorted();

        const actualProperties = Object.keys(response.body).toSorted();

        assert.deepStrictEqual(actualProperties, expectedProperties);
    });

    test("Returns 400 for invalid bodies", async () => {
        const exampleUsername = exampleUser.username;
        async function sendUser(body)
        {
            await api.put(`${baseUrl}/${exampleUsername}`)
            .send(body)
            .expect(400);
        }

        const tests = [
            sendUser(),
            sendUser({}),
            sendUser({ usernam: "newUsername" }),
            sendUser({ username: null }),
            sendUser({ username: 1234567891234567 })
        ]

        await Promise.all(tests);
    });

    test("Returns 400 for non-email username", async () => {
        
        const invalidUsernames = [
            "",
            "xXxDaveyBoyxXx",
            3000,
            "https://www.Dave.com",
            "Dave@email",
            null,
            undefined
        ]

        const exampleUsername = exampleUser.username;
        await Promise.all(invalidUsernames.map(async usr => {
            await api.put(`${baseUrl}/${exampleUsername}`)
            .send({ ...newExampleUser, username: usr})
            .expect(400);
        }));

    });

});

describe("GET users/:id", () => {

    beforeEach(async () => {
        await ReadingList.destroy({ where: {} });
        await Blog.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    function getUser(id)
    {
        return api.get(`${baseUrl}/${id}`);
    }

    test("Returns name, username, and readinglist", async () => {
        const {id: userId} = await User.create(existingExampleUser,);

        const user = await User.findByPk(
            userId,
            {
                include: {
                    model: ReadingList,
                    include: {
                        // shouldn't need to define the whole thing
                        // as there's nothing there
                        model: Blog
                    }
                }
            }
        );

        const response = await getUser(user.id).expect(200);
        
        assert.deepStrictEqual(response.body, {
            name: user.name,
            username: user.username,
            readingLists: user.readingLists
        });
    });

    test("readinglist is empty list by default", async () => {
        const user = await User.create(existingExampleUser);

        const response = await getUser(user.id).expect(200);
        
        assert.deepStrictEqual(response.body.readingLists, []);
    });

    test("readinglist contains marked blog and read status", async () => {
        const { user, blog } = await createUserAndBlog(existingExampleUser, exampleBlog);

        const readingLists = await ReadingList.create({ userId: user.id, blogId: blog.id });

        const response = await getUser(user.id).expect(200);
        const readinglist = response.body.readingLists;

        const expectedProperties = [
            "id",
            "url",
            "title",
            "author",
            "likes",
            "year"
        ];

        const expected = pickProperties(blog.toJSON(), expectedProperties);
        expected.readingLists = [pickProperties(readingLists.toJSON(), ["read", "id"])];

        assert.strictEqual(readinglist.length, 1);
        assert.deepStrictEqual(readinglist[0], expected);
    });

    test("Returns 404 for nonexistent id", async () => {
        await getUser(200000).expect(404);
    });

    test("Returns 400 for invalid id", async () => {

        const invalidIds = [
            undefined,
            null,
            123.123,
            "hello"
        ];

        const settled = await Promise.allSettled(invalidIds.map( (id) => {
            return getUser(id).expect(400);
        }));

        const settledError = getSettledError(settled, invalidIds);
        if (settledError.rejections) throw new Error(settledError.rejectReason);
    });

})