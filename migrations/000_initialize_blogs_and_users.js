const { DataTypes } = require("sequelize");

const userAttributes = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    username: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}

const blogsAttributes = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    author: {
        type: DataTypes.TEXT,
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    title: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    likes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: val => {
                // a float will actually be converted to an integer,
                // so those are also fine if they pass here, just don't want strings
                if (!Number.isSafeInteger(val)) {
                    throw new Error("Blog.likes should be an integer");
                };
            },
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: "users",
            key: "id",
        }
    }
};

const dateAts = {
    "created_at": {
        type: DataTypes.DATE,
        defaultValue: new Date()
    },
    "updated_at": {
        type: DataTypes.DATE,
        defaultValue: new Date()
    }
}

module.exports = {
    up: ({ context: queryInterface }, Sequelize) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.createTable(
                "users",
                {
                    ...userAttributes,
                    ...dateAts
                },
                { transaction: t }
            );
            await queryInterface.createTable(
                "blogs",
                {
                    ...blogsAttributes,
                    ...dateAts
                },
                { transaction: t }
            )
        });
    },
    down: ({ context: queryInterface }, _Sequelize) => {
        return queryInterface.sequelize.transaction(async t => {
            await queryInterface.dropTable("blogs", { transaction: t });
            await queryInterface.dropTable("users", { transaction: t });
        });
    },
}