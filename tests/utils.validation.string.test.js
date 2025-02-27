const { before, beforeEach, describe, test } = require("node:test");
const assert = require("node:assert");

const { checkPassword, checkUsername } = require("../src/utils/validation/string");
const { symbolsString } = require("../src/utils/regexp");



test("Password is checked correctly", () => {

    const base = "Som3p@ssword";

    invalidExtensions = [
        " ",
        "\n",
        "\r",
        "\t",
        "ä",
        "Ö"
    ];

    assert(!checkPassword(base));

    invalidExtensions.forEach(ext => {
        assert(checkPassword(base+ext));
        assert(checkPassword(ext+base));
    });

});

test("Username is checked correctly", () => {
    const base = "AvalidUs3rname";

    invalidExtensions = [
        " ",
        "\n",
        "\r",
        "\t",
        "ä",
        "Ö",
    ].concat([..."~`!@#$%^&*()+={[}]|\:;\"'<,>.?/"]);

    assert(!checkUsername(base));

    invalidExtensions.forEach(ext => {
        assert(checkUsername(base+ext));
        assert(checkUsername(ext+base));
    });
});