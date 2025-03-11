const supertest = require("supertest");
const bcrypt = require("bcryptjs");

const { before, beforeEach, describe, test, after } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const { User, Blog } = require("../src/sequelize/models.js");
const { forceSync } = require("../src/sequelize/migrations.js");

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
    const createdBlog = await Blog.create({ ...blog, UserId: createdUser.id });
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

    test("Returns username, name, and password hash", async () => {

        const response = await api.post(baseUrl)
            .send(newExampleUser)
            .expect(200);

        const { username, name, passwordHash } = response.body;
        assert(typeof passwordHash === "string");
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