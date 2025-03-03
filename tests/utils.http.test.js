const { describe, test, after, beforeEach, before, afterEach } = require("node:test");
const assert = require("node:assert");

const { createBearerString, parseBearerString } = require("../src/utils/http.js");


describe("Bearer token", () => {

    const token = "sometokenstring";
    const validBearerString = `Bearer ${token}`;

    test("Is created successfully", () => {
        assert.strictEqual(
            createBearerString(token),
            validBearerString
        )
    });

    test("Is parsed succesfully", () => {
        assert.strictEqual(
            parseBearerString(validBearerString),
            token
        )
    });

    test("Creation returns null for non-string arguments", () => {

        const invalidValues = [
            1,
            1.4,
            [1,2,3],
            { some: "value" },
            null,
            undefined
        ];

        invalidValues.forEach(val => {
            assert.strictEqual(
                createBearerString(val),
                null
            )
        });

    });

    test("Parsing returns null for invalid values", () => {

        const invalidValues = [
            token,
            " token",
            "Bearer",
            "Bearer ",
            null,
            undefined,
            [1,2,3],
            {}
        ];

        invalidValues.forEach(val => {
            const result = parseBearerString(val);
            assert.strictEqual(result, null);
        });

    });

});