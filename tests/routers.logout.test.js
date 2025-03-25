const supertest = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { before, beforeEach, describe, test, after } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const { User, Session } = require("../src/sequelize/models.js");
const { forceSync } = require("../src/sequelize/migrations.js");
const { createBearerString } = require("../src/utils/http.js");
const { ensureAllSettled } = require("../src/utils/testing.js");
const localJwt = require("../src/utils/jwt.js");


const api = supertest(app);
const baseUrl = "/api/logout"

const examplePassword = "AperfectlyV4l!dpassword";
const exampleHash = bcrypt.hashSync(examplePassword, 10);
const existingExampleUser = {
    name: "Dave Example",
    username: "DaveyBoy@DavesSite.com",
    passwordHash: exampleHash
};
const otherExistingExampleUser = {
    name: "John Doe",
    username: "username@service.com",
    passwordHash: exampleHash
};

before(async () => {
    await forceSync();
    await User.create(existingExampleUser);
    await User.create(otherExistingExampleUser);
});

async function login(body)
{
    body ??= {
        username: existingExampleUser.username,
        password: examplePassword
    }
    const response = await api.post("/api/login")
        .send(body)
        .expect(200);

    return response.body.token;
}

describe("DELETE logout", () => {

    function logout(body, token)
    {
        return api.delete(baseUrl)
            .send(body)
            .set("authorization", createBearerString(token));

    }

    beforeEach(async () => {
        Session.destroy({ where: {} });
    });

    test("Invalidates used token when body is { all: false }", async () => {
        const token = await login();
        await login();
        await login({
            username: otherExistingExampleUser.username,
            password: examplePassword
        });
        assert.strictEqual(await Session.count(), 3);

        const { username, uuid } = localJwt.verifyToken(token);
        assert(await Session.isValidSession(username, uuid));

        await logout({ all: false }, token).expect(204);
        assert.strictEqual(await Session.count(), 2);
        assert(!(await Session.isValidSession(username, uuid)));
    });

    test("Invalidates all user's sessions when body is { all: true }", async () => {

        const token = await login();
        await login();
        const otherToken = await login({
            username: otherExistingExampleUser.username,
            password: examplePassword
        });
        
        assert.strictEqual(await Session.count(), 3);

        await logout({ all: true }, token).expect(204);
        assert.strictEqual(await Session.count(), 1);
        const { username: otherUsername, uuid } = localJwt.verifyToken(otherToken);
        assert(await Session.isValidSession(otherUsername, uuid));
    });

    test("Returns 401 for invalid or missing authorization", async () => {
        const invalidValues = [
            "no auth",
            1,
            1.4,
            [1,2,3],
            { some: "value" },
            null,
            undefined,
            jwt.sign({ // incorrect secret for jwt
                username: existingExampleUser.username,
                uuid: "5dfcc99d-bb89-47fb-98fe-13371369b5f0"
            }, "1234321SomesecretstringAAA", { noTimestamp: true }) 
        ];

        await ensureAllSettled(invalidValues, val => {
            if (val === "no auth") {
                return api.delete(baseUrl).send({ all: false }).expect(401);
            }
            if (!val) {
                // sending null and undefined too, otherwise they
                // get replaced by the actual token
                return api.delete(baseUrl)
                    .send({ all: false })
                    .set("authorization", createBearerString(val))
                    .expect(401);
            }
            return logout({ all: false }, val).expect(401);
        });
    });

    test("Returns 400 for invalid body", async () => {
        const token = await login();
        
        const invalidValues = [
            null,
            undefined,
            { all: 1 },
            { all: 0 },
            { all: null },
            { },
            [ false ]
        ];

        await ensureAllSettled(invalidValues, val => {
            if (!val) {
                return api.delete(baseUrl)
                    .send(val)
                    .set("authorization", createBearerString(token))
                    .expect(400);
            }
            return logout(val, token).expect(400);
        });
    });

});