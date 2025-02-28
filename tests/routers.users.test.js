const supertest = require("supertest");
const bcrypt = require("bcryptjs");

const { before, beforeEach, describe, test, after } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const User = require("../src/sequelize/models/users");

const api = supertest(app);


const examplePassword = "AperfectlyV4l!dpassword";
const exampleHash = bcrypt.hashSync(examplePassword, 10);
const exampleUser = {
    name: "Dave Example",
    username: "xXxDaveyxXx",
};
const newExampleUser = {
    ...exampleUser,
    password: examplePassword
}
const existingExampleUser = {
    ...exampleUser,
    passwordHash: exampleHash
}

const base_url = "/api/users";

before(async () => {
    await User.sync({ force: true, match: /testing/ });

});

describe("GET users", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
    });

    test("Returns empty list when no users", async () => {

        const response = await api.get(base_url)
            .expect(200);

        const users = response.body;
        assert.strictEqual(users.length, 0);

    });

    test("Returns matching user", async () => {

        await User.create(existingExampleUser);

        const response = await api.get(base_url)
            .expect(200);

        const users = response.body;
        const { name, username, passwordHash } = users[0];
        assert.deepStrictEqual({ name, username, passwordHash }, existingExampleUser);
    });

});

describe("POST users", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
    });

    test("Returns username, name, and password hash", async () => {

        const response = await api.post(base_url)
            .send(newExampleUser)
            .expect(200);

        const { username, name, passwordHash } = response.body;
        assert(typeof passwordHash === "string");
        assert.deepStrictEqual({ username, name }, exampleUser);
    });

    test("Sets createdAt, updatedAt timestamps", async () => {

        const response = await api.post(base_url)
            .send(newExampleUser)
            .expect(200);

        const { createdAt, updatedAt } = response.body;
        assert(!createdAt);
        assert.deepStrictEqual(createdAt, updatedAt);

    });

    test("Returns 400 for wrong length username (<8, >30)", async () => {
        await api.post(base_url)
            .send({ ...newExampleUser, username: "short"})
            .expect(400);

        await api.post(base_url)
            .send({ ...newExampleUser, username: "t"+"o".repeat(30)+"long"})
            .expect(400);
    });

    test("Returns 400 for username with invalid symbols", async () => {

        // not obviously very easy to be comprehensive about it,
        // so just put a few examples here, at least for now
        const invalidExtensions = [
            " ",
            "\n",
            "\r",
            "\t",
            "ä",
            "Ö",
        ].concat([..."~`!@#$%^&*()+={[}]|\\:;\"'<,>.?/"]);

        const errorState = {
            err: undefined
        }

        function postUser(user)
        {
            return api.post(base_url)
                .send(user)
                .expect(400);
        }

        const exampleUsername = exampleUser.username;
        await Promise.all([
            Promise.all(invalidExtensions.map(ext => {
                return postUser({ ...newExampleUser, username: exampleUsername+ext });
            })),
            Promise.all(invalidExtensions.map(ext => {
                return postUser({ ...newExampleUser, username: ext+exampleUsername });
            }))
        ]);

        if (errorState.err) throw errorState.err;

    });

    test("Returns 400 for wrong length password (<12, >64)", async () => {
        await api.post(base_url)
            .send({ ...newExampleUser, password: "Sh@r7"})
            .expect(400);

        await api.post(base_url)
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
                return api.post(base_url)
                    .send({ ...newExampleUser, password: examplePassword+ext })
                    .expect(400);
            })),
            Promise.all(invalidExtensions.map(ext => {
                return api.post(base_url)
                    .send({ ...newExampleUser, password: ext+examplePassword })
                    .expect(400);
            }))
        ]);

    });

    // There's some weird overlap between these tests
    // and the next ones, where the last two here
    // seem to cause the first below to fail due to
    // there being a user in the database despite the .destroy
    // below. This after seems to fix that.
    after(async () => await User.destroy({ where: {} }));

});

describe("Change username", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
        await User.create(existingExampleUser);
    });

    test("Changes username", async () => {
        let user = await User.findOne();

        const newUsername = "newUsername";
        const response = await api.put(`${base_url}/${user.username}`)
            .send({ username: newUsername })
            .expect(200);

        user = await User.findByPk(user.id);


        assert.strictEqual(response.body.username, newUsername);

    });

    test("Changes updatedAt timestamp", async () => {

        let user = await User.findOne();

        const oldStamp = user.updatedAt;

        const newUsername = "newUsername";
        await api.put(`${base_url}/${user.username}`)
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
            await api.put(`${base_url}/${exampleUsername}`)
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


    test("Returns 400 for wrong length username (<8, >30)", async () => {
        const exampleUsername = exampleUser.username;
        await api.put(`${base_url}/${exampleUsername}`)
            .send({ username: "short" })
            .expect(400);

        await api.put(`${base_url}/${exampleUsername}`)
            .send({ username: "t"+"o".repeat(30)+"long" })
            .expect(400);
    });

    test("Returns 400 for username with invalid symbols", async () => {
        
        // not obviously very easy to be comprehensive about it,
        // so just put a few examples here, at least for now
        const invalidExtensions = [
            " ",
            "\n",
            "\r",
            "\t",
            "ä",
            "Ö",
        ].concat([..."~`!@#$%^&*()+={[}]|\\:;\"'<,>.?/"]);
        
        const exampleUsername = exampleUser.username;
        await Promise.all([
            Promise.all(invalidExtensions.map(ext => {
                return api.put(`${base_url}/${exampleUsername}`)
                    .send({ username: exampleUsername+ext })
                    .expect(400);
            })),
            Promise.all(invalidExtensions.map(ext => {
                return api.put(`${base_url}/${exampleUsername}`)
                    .send({ username: ext+exampleUsername })
                    .expect(400);
            }))
        ]);

    });

});