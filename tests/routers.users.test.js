const supertest = require("supertest");
const bcrypt = require("bcryptjs");

const { before, beforeEach, describe, test } = require("node:test");
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
        assert.deepStrictEqual({ name, username, passwordHash }, exampleUser);
    });

});

describe("POST users", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
    });

    test("Returns username, name, and password hash", async () => {

        const response = await api.post(base_url)
            .send(exampleUser)
            .expect(200);

        const { username, user, passwordHash } = response.body;
        assert.deepStrictEqual({ username, user, passwordHash}, exampleUser);
    });

    test("Sets createdAt, updatedAt timestamps", async () => {

        const response = await api.post(base_url)
            .send(exampleUser)
            .expect(200);

        const { createdAt, updatedAt } = response.body;
        assert(!createdAt);
        assert.deepStrictEqual(createdAt, updatedAt);

    });

    test("Returns 400 for wrong length username (<8, >24)", async () => {
        await api.post(base_url)
            .send({ ...exampleUser, password: "short"})
            .expect(400);

        await api.post(base_url)
            .send({ ...exampleUser, password: "t"+"o".repeat(30)+"long"})
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
            "Ö"
        ];

        const exampleUsername = exampleUser.username;
        await Promise.all([
            Promise.all(invalidExtensions.map(ext => {
                return api.post(base_url)
                    .send(exampleUsername+ext)
                    .expect(400);
            })),
            Promise.all(invalidExtensions.map(ext => {
                return api.post(base_url)
                    .send(ext+exampleUsername)
                    .expect(400);
            }))
        ]);

    });

    test("Returns 400 for wrong length password (<12, >64)", async () => {
        await api.post(base_url)
            .send({ ...exampleUser, password: "Sh@r7"})
            .expect(400);

        await api.post(base_url)
            .send({ ...exampleUser, password: "To0!"+"o".repeat(64)+"ng"})
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
                    .send(examplePassword+ext)
                    .expect(400);
            })),
            Promise.all(invalidExtensions.map(ext => {
                return api.post(base_url)
                    .send(ext+examplePassword)
                    .expect(400);
            }))
        ]);

    });

});

describe("Change username", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
        await User.create(existingExampleUser);
    });

    test("Changes username", async () => {

        let user = await User.findOne();

        const newUsername = "newUsername";
        await api.put(`${base_url}/${user.username}`)
            .send({ username: newUsername })
            .expect(200);

        user = await User.findByPk(user.id);

        assert.strictEqual(user.username, newUsername);

    });

    test("Changes updatedAt timestamp", async () => {

        let user = await User.findOne();

        const oldStamp = user.updatedAt;

        const newUsername = "newUsername";
        await api.put(`${base_url}/${user.username}`)
            .send({ username: newUsername })
            .expect(200);

        user = await User.findByPk(user.id);
        assert(oldStamp && user.updatedAt);
        assert.notStrictEqual(oldStamp, user.updatedAt);

    });

});