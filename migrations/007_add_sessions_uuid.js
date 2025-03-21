const { DataTypes } = require("sequelize");

const tableName = "sessions";
module.exports = {
    down: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.removeConstraint(
                tableName,
                "unique_username_uuid",
                { transaction: t }
            );
            await queryInterface.removeColumn(
                tableName,
                "uuid",
                { transaction: t }
            );
            // due to potential multiple usernames, just delete
            // all sessions. On the user's end, this would just
            // mean that they would have to login again.
            await queryInterface.bulkDelete(
                tableName,
                {},
                { transaction: t}
            )
            await queryInterface.addConstraint(
                tableName,
                {
                    type: "UNIQUE",
                    fields: ["username"],
                    name: "unique_username",
                    transaction: t
                },
            );
        });
    },
    up: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.removeConstraint(
                tableName,
                "unique_username",
                { transaction: t }
            );
            await queryInterface.addColumn(
                tableName,
                "uuid",
                {
                    type: DataTypes.UUID,
                    allowNull: false
                },
                { transaction: t }
            );
            await queryInterface.addConstraint(
                tableName,
                {
                    type: "UNIQUE",
                    fields: ["username", "uuid"],
                    name: "unique_username_uuid",
                    transaction: t
                },
            );
        });
    },
}

// module.exports = {
//     up: () => {return {}},
//     down: () => {return {}}
// }