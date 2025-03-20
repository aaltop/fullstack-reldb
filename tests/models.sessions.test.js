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
        await Session.create({ username: existingExampleUser.username });
    });

    test("Can be invalidated", async () => {
        assert(await Session.hasValidSession(existingExampleUser.username));
        assert(await Session.setAsInvalid(existingExampleUser.username));
        assert(!(await Session.hasValidSession(existingExampleUser.username)));
    });

    test("Can be set to valid", async () => {
        assert(await Session.hasValidSession(existingExampleUser.username));
        assert(await Session.setAsInvalid(existingExampleUser.username));
        assert(!(await Session.hasValidSession(existingExampleUser.username)));
        assert(await Session.setAsValid(existingExampleUser.username));
        assert(await Session.hasValidSession(existingExampleUser.username));
    });

    test("Is tested correctly", async () => {
        const actual = [
            [
                await Session.hasValidSession(existingExampleUser.username) === true,
                "correct username"
            ],
            [
                await Session.hasValidSession("BoyHowdy@DavesSite.com") === false,
                "non-existent user"
            ],
        ];

        await Session.setAsInvalid(existingExampleUser.username);
        actual.push([
            await Session.hasValidSession(existingExampleUser.username) === false,
            "invalidated session"
        ]);

        await Session.setAsValid(existingExampleUser.username);
        actual.push([
            await Session.hasValidSession(existingExampleUser.username) === true,
            "set session as valid"
        ]);

        let session = await Session.findOne({ where: { username: existingExampleUser.username }});
        const validUntil = new Date(Date.now() + 60e4);
        session.validUntil = validUntil;
        session = await session.save();
        assert.strictEqual(session.validUntil.getTime(), validUntil.getTime());
        actual.push([
            await Session.hasValidSession(existingExampleUser.username) === true,
            "set valid time a minute into the future"
        ]);

        await User.destroy({ where: { username: existingExampleUser.username }});
        actual.push([
            await Session.hasValidSession(existingExampleUser.username) === false,
            "deleted user"
        ]);

        const result = actual.filter(val => !val[0]);
        if (result.length !== 0) throw new Error(JSON.stringify(result));

    });

});