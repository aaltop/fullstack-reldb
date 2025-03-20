const { DataTypes } = require("sequelize");

const dateAts = {
    "created_at": {
        type: DataTypes.DATE,
    },
    "updated_at": {
        type: DataTypes.DATE,
    }
};
const tableName = "sessions";
module.exports = {
    up: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.createTable(
                tableName,
                {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        autoIncrement: true
                    },
                    username: {
                        type: DataTypes.TEXT,
                        references: {
                            model: "users",
                            key: "username"
                        },
                        onDelete: "CASCADE"
                    },
                    valid_until: { // null is no end date
                        type: DataTypes.DATE,
                    },
                    ...dateAts
                },
                { transaction: t }
            );
        });
    },
    down: ({ context: queryInterface }) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.dropTable(
                tableName,
                { transaction: t }
            );
        });
    },
}