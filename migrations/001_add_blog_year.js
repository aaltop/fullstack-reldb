const { DataTypes } = require("sequelize");


module.exports = {
    up: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.addColumn(
                "blogs",
                "year",
                {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                { transaction: t }
            );
        });
    },
    down: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.removeColumn(
                "blogs",
                "year",
                { transaction: t }
            );
        });
    },
}