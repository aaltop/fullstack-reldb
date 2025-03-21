const bcrypt = require("bcryptjs");

const { describe, test, after, beforeEach, before, afterEach } = require("node:test");
const assert = require("node:assert");

const { User, Session } = require("../src/sequelize/models.js");
const { ensureAllSettled } = require("../src/utils/testing.js");
const { forceSync } = require("../src/sequelize/migrations.js");


const examplePassword = "AperfectlyV4l!dpassword";
const exampleHash = bcrypt.hashSync(examplePassword, 10);
const existingExampleUser = {
    name: "Dave Example",
    username: "DaveyBoy@DavesSite.com",
    passwordHash: exampleHash
};

before(async () => {
    await forceSync(); 
});

describe("Session validity", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
        await User.create(existingExampleUser);
    });

    async function createSession()
    {
        const { username, uuid } = await Session.create({ username: existingExampleUser.username });
        return { username, uuid }
    }

    test("Can be invalidated", async () => {
        const { username, uuid } = await createSession();
        assert(await Session.isValidSession(username, uuid));
        assert(await Session.setAsInvalid(existingExampleUser.username));
        assert(!(await Session.isValidSession(username, uuid)));
    });

    test("Can be set to valid", async () => {
        const { username, uuid } = await createSession();
        assert(await Session.isValidSession(username, uuid));
        assert(await Session.setAsInvalid(existingExampleUser.username));
        assert(!(await Session.isValidSession(username, uuid)));
        assert(await Session.setAsValid(existingExampleUser.username));
        assert(await Session.isValidSession(username, uuid));
    });

    test("Is tested correctly", async () => {
        const { username, uuid } = await createSession();

        const actual = [
            [
                await Session.isValidSession(username, uuid) === true,
                "correct username"
            ],
            [
                await Session.isValidSession("BoyHowdy@DavesSite.com", uuid) === false,
                "non-existent user"
            ],
        ];

        await Session.setAsInvalid(existingExampleUser.username);
        actual.push([
            await Session.isValidSession(username, uuid) === false,
            "invalidated session"
        ]);

        await Session.setAsValid(existingExampleUser.username);
        actual.push([
            await Session.isValidSession(username, uuid) === true,
            "set session as valid"
        ]);

        let session = await Session.findOne({ where: { username: existingExampleUser.username }});
        const validUntil = new Date(Date.now() + 60e4);
        session.validUntil = validUntil;
        session = await session.save();
        assert.strictEqual(session.validUntil.getTime(), validUntil.getTime());
        actual.push([
            await Session.isValidSession(username, uuid) === true,
            "set valid time a minute into the future"
        ]);

        await User.destroy({ where: { username: existingExampleUser.username }});
        actual.push([
            await Session.isValidSession(username, uuid) === false,
            "deleted user"
        ]);

        const result = actual.filter(val => !val[0]);
        if (result.length !== 0) throw new Error(JSON.stringify(result));

    });

    test("Can be invalidated individually", async () => {
        const first = await createSession();
        const second = await createSession();

        assert(await Session.isValidSession(first.username, first.uuid));
        assert(await Session.isValidSession(second.username, second.uuid));

        assert(await Session.setAsInvalid(first.username, first.uuid));
        assert(await Session.isValidSession(second.username, second.uuid));
        assert(!(await Session.isValidSession(first.username, first.uuid)));
    });

    test("Can be set as valid individually", async () => {
        const first = await createSession();
        const second = await createSession();

        assert(await Session.setAsInvalid(first.username));

        assert(!(await Session.isValidSession(first.username, first.uuid)));
        assert(!(await Session.isValidSession(second.username, second.uuid)));

        assert(await Session.setAsValid(second.username, second.uuid));
        assert(await Session.isValidSession(second.username, second.uuid));
        assert(!(await Session.isValidSession(first.username, first.uuid)));
    })

});