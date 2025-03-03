const jwt = require("../src/utils/jwt.js");
const baseJwt = require("jsonwebtoken");

const { describe, test, after, beforeEach, before, afterEach } = require("node:test");
const assert = require("node:assert");

const { payloadFromBearerString, usernameFromBearerString } = require("../src/express/utils.js");
const { createBearerString } = require("../src/utils/http.js");


const payload = { username: "Some@username.com" };
const otherPayload = { username: "SomeOther@username.com" };
const token = jwt.signPayload(payload);

describe("payloadFromBearerString", () => {

    test("Decodes payload successfully", () => {
        const ret = payloadFromBearerString(createBearerString(token));
        assert.strictEqual(ret.error, undefined);
        assert.deepStrictEqual(payload, ret.payload);
    });

    test("Returns error when given invalid auth string", () => {
        const invalidTokens = [
            null,
            undefined,
            123,
            [1,2,3],
            {token: "token"},
            "somelongishstring",
            baseJwt.sign(otherPayload, "ShouldNotbeTheSameSECCREtastheproginal", { noTimestamp: true })
        ];

        invalidTokens.forEach(val => {
            const ret = payloadFromBearerString(createBearerString(val));
            assert.strictEqual(ret.payload, undefined);
            assert.throws(() => { throw ret.error });
        });

        invalidTokens.forEach(val => {
            const ret = payloadFromBearerString(`Basic ${val}`);
            assert.strictEqual(ret.payload, undefined);
            assert.throws(() => { throw ret.error });
        });
    });

});

describe("usernameFromBearerString", () => {

    test("Returns username correctly", () => {

        const usernamePayload = usernameFromBearerString(createBearerString(token));
        assert.deepStrictEqual(usernamePayload.username, payload.username);
        assert.strictEqual(usernamePayload.error, undefined);

    });

    test("Returns error for invalid username properties in payload", () => {

        const invalidUsernames = [
            null,
            undefined,
            123,
            [1,2,3],
            { username: "Some@Username.com" }
        ];

        invalidUsernames.forEach(usr => {
            const token = jwt.signPayload({ username: usr });
            const usernamePayload = usernameFromBearerString(createBearerString(token));
            assert.strictEqual(usernamePayload.username, undefined);
            assert.throws(() => { throw usernamePayload.error });
        });

    })

});