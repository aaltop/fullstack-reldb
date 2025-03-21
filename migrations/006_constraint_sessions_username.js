
const tableName = "sessions";
module.exports = {
    up: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.addConstraint(
                tableName,
                {
                    type: "UNIQUE",
                    fields: ["username"],
                    name: "unique_username",
                },
                { transaction: t }
            );
        });
    },
    down: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.removeConstraint(
                tableName,
                "unique_username",
                { transaction: t }
            );
        });
    },
}