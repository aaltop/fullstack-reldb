const { DataTypes } = require("sequelize");

const tableName = "reading_lists";
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
                    user_id: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        references: { model: "users", key: "id" }
                    },
                    blog_id: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        references: { model: "blogs", key: "id" }
                    },
                    read: {
                        type: DataTypes.BOOLEAN,
                        allowNull: false,
                        defaultValue: false
                    },
                    created_at: {
                        type: DataTypes.DATE,
                        defaultValue: new Date()
                    },
                    updated_at: {
                        type: DataTypes.DATE,
                        defaultValue: new Date()
                    }
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