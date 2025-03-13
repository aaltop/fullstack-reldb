const { DataTypes } = require("sequelize");

const tableName = "reading_lists";
module.exports = {
    up: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.addConstraint(
                tableName,
                {
                    type: "UNIQUE",
                    fields: ["user_id", "blog_id"],
                    name: "unique_user_blog"
                },
                { transaction: t }
            );
        });
    },
    down: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.removeConstraint(
                tableName,
                "unique_user_blog",
                { transaction: t }
            );
        });
    },
}