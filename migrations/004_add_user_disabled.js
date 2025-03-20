const { DataTypes } = require("sequelize");


const tableName = "users";
module.exports = {
    up: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.addColumn(
                tableName,
                "disabled",
                {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                },
                { transaction: t }
            );
        });
    },
    down: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.removeColumn(
                tableName,
                "disabled",
                { transaction: t }
            );
        });
    },
}