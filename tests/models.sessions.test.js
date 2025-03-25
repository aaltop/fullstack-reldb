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

const otherexistingExampleUser = {
    name: "John Doe",
    username: "username@service.com",
    passwordHash: exampleHash
};

before(async () => {
    await forceSync(); 
});

async function createSession(username)
{
    username ??= existingExampleUser.username;
    const { uuid } = await Session.create({ username });
    return { username, uuid }
}

describe("Session validity", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
        await Session.destroy({ where: {} });
        await User.create(existingExampleUser);
    });

    test("Can be invalidated", async () => {
        const { username, uuid } = await createSession();
        assert(await Session.isValidSession(username, uuid));
        assert.strictEqual(await Session.setAsInvalid(existingExampleUser.username), 1);
        assert(!(await Session.isValidSession(username, uuid)));
    });

    test("Check deletes invalid session", async () => {
        const { username, uuid } = await createSession();
        assert.strictEqual(await Session.count(), 1);
        assert.strictEqual(await Session.setAsInvalid(existingExampleUser.username), 1);
        assert(!(await Session.isValidSession(username, uuid)));
        assert.strictEqual(await Session.count(), 0);
    });

    test("Can be set to valid", async () => {
        const { username, uuid } = await createSession();
        assert(await Session.isValidSession(username, uuid));
        assert.strictEqual(await Session.setAsInvalid(existingExampleUser.username), 1);
        assert(!(await Session.isValidSession(username, uuid, false)));
        assert.strictEqual(await Session.setAsValid(existingExampleUser.username), 1);
        assert(await Session.isValidSession(username, uuid));
    });

    test("Is tested correctly", async () => {
        let { username, uuid } = await createSession();

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
            await Session.isValidSession(username, uuid, false) === false,
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

        assert.strictEqual(await Session.setAsInvalid(first.username, first.uuid), 1);
        assert(await Session.isValidSession(second.username, second.uuid));
        assert(!(await Session.isValidSession(first.username, first.uuid)));
    });

    test("Can be set as valid individually", async () => {
        const first = await createSession();
        const second = await createSession();

        assert.strictEqual(await Session.setAsInvalid(first.username), 2);

        assert(!(await Session.isValidSession(first.username, first.uuid, false)));
        assert(!(await Session.isValidSession(second.username, second.uuid, false)));

        assert.strictEqual(await Session.setAsValid(second.username, second.uuid), 1);
        assert(await Session.isValidSession(second.username, second.uuid));
        assert(!(await Session.isValidSession(first.username, first.uuid)));
    });

    test("Methods throw error for non-string username", async () => {
        const invalidValues = [
            undefined,
            null,
            1,
            [],
            { username: "name@service.com" },
        ];

        const { uuid } = await createSession();
        
        await ensureAllSettled(invalidValues, val => {
            return assert.rejects(Session.isValidSession(val, uuid));
        });

        await ensureAllSettled(invalidValues, val => {
            return assert.rejects(Session.setAsInvalid(val, uuid));
        });

        await ensureAllSettled(invalidValues, val => {
            return assert.rejects(Session.setAsValid(val, uuid));
        });
    });

});

describe("Session removal", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
        await Session.destroy({ where: {} });
        await User.create(existingExampleUser);
        await User.create(otherexistingExampleUser);
    });

    test("Succeeds for existing session", async () => {
       const ses = await createSession();
       assert.strictEqual(await Session.count(), 1);
       assert.strictEqual(await Session.deleteSession(ses.username, ses.uuid), 1);
       assert.strictEqual(await Session.count(), 0);
    });

    test("Fails for nonexistent session", async () => {
        const ses = await createSession();
        assert.strictEqual(await Session.count(), 1);
        assert.strictEqual(await Session.deleteSession("Sometest@username.com"), 0);
        assert.strictEqual(await Session.deleteSession("Sometest@username.com", ses.uuid), 0);
        assert.strictEqual(await Session.count(), 1);
    });

    test("Can be done per session", async () => {
        const first = await createSession();
        const second = await createSession();
        assert.strictEqual(await Session.count(), 2);
        assert.strictEqual(await Session.deleteSession(first.username, first.uuid), 1);
        assert.strictEqual(await Session.count(), 1);
        assert(await Session.isValidSession(second.username, second.uuid));
    });

    test("Can be done per user", async () => {
        let first;
        first = await createSession();
        const second = await createSession(otherexistingExampleUser.username);
        assert.strictEqual(await Session.count(), 2);
        assert.strictEqual(await Session.deleteSession(first.username, first.uuid), 1);
        assert.strictEqual(await Session.count(), 1);
        assert(await Session.isValidSession(second.username, second.uuid));

        first = await createSession();
        await createSession();
        assert.strictEqual(await Session.count(), 3);
        assert.strictEqual(await Session.deleteSession(first.username), 2);
        assert.strictEqual(await Session.count(), 1);
        assert(await Session.isValidSession(second.username, second.uuid));
    });

    test("Throws error for non-string username", async () => {
       
        const invalidValues = [
            undefined,
            null,
            1,
            [],
            { username: "name@service.com" },
        ];

        await ensureAllSettled(invalidValues, val => {
            return assert.rejects(Session.deleteSession(val, "db5c3bdf-3425-45b6-a7a6-bb13e19775be"));
        });
        await ensureAllSettled(invalidValues, val => {
            return assert.rejects(Session.deleteSession(val));
        });
    });

});