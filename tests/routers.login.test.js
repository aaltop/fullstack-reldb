const supertest = require("supertest");

const { before, beforeEach, describe, test, after } = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const { User } = require("../src/sequelize/models.js");


const api = supertest(app);
const baseUrl = "/api/login";
const newExampleuser = {
    name: "Dave Example",
    username: "DaveyBoy@DavesSite.com",
    password: "Ap3rfectlyv@lidpassword"

};

describe("POST login", () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });

        await api.post("/api/users")
            .send(newExampleuser)
            .expect(200);
    });

    const exampleLoginDetails = { ...newExampleuser, name: undefined };

    function createPost(user)
    {
        user ??= exampleLoginDetails;
        return api.post(baseUrl)
            .send(user);
    }

    test("Returns token", async () => {
        const response = await createPost().expect(200);
        assert(typeof response.body.token === "string");
    });

    test("Returns 400 for invalid password", async () => {

        const invalidPasswords = [
            exampleLoginDetails.password+"1",
            null,
            12345,
            { password: exampleLoginDetails.password },
            [3,2,1]
        ];

        Promise.all(invalidPasswords.map(val => {
            return createPost({
                ...exampleLoginDetails,
                password: val
            }).expect(400);
        }));
    });

    test("Returns 400 for invalid username", async () => {

        const invalidUsernames = [
            "1"+exampleLoginDetails.username,
            null,
            12345,
            { username: exampleLoginDetails.username },
            [3,2,1]
        ];

        Promise.all(invalidUsernames.map(val => {
            return createPost({
                ...exampleLoginDetails,
                username: val
            }).expect(400);
        }));
    });

    test("Returns 400 for missing values", async () => {

        await createPost({ ...exampleLoginDetails, username: undefined})
            .expect(400);
        
        await createPost({ ...exampleLoginDetails, password: undefined})
            .expect(400);

    });

});