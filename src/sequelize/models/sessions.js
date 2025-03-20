const { DataTypes, Model } = require("sequelize");

const sequelize = require("../connection");

const attributes = [
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        validUntil: { // null is no end date
            type: DataTypes.DATE,
        }
    }
];

class Session extends Model {

    /**
     * Check whether the user has a valid session.
     * @param {string} username 
     * @returns 
     */
    static async hasValidSession(username)
    {
        const session = await Session.findOne({ where: { username }});
        if (!session) return false;
        if (session.validUntil === null) return true;
        const now = new Date();
        // if time is negative, not valid anymore, otherwise valid
        return ((session.validUntil.getTime() - now.getTime()) > 0);
    }

    /**
     * Invalidate the session of the user. If a matching session
     * is not found, return false.
     * @param {string} username 
     * @returns
     */
    static async setAsInvalid(username)
    {
        const session = await Session.findOne({ where: { username }});
        if (!session) return false;
        session.validUntil = Date.now() - 24*60*60*1000;
        await session.save();
        return true;
    }

    /**
     * Set the session of the user as valid. If a matching session
     * is not found, return false.
     * @param {string} username 
     * @returns
     */
    static async setAsValid(username)
    {
        const session = await Session.findOne({ where: { username }});
        if (!session) return false;
        session.validUntil = null;
        await session.save();
        return true;
    }
}

Session.init(
    Object.assign({}, ...attributes),
    {
        underscored: true,
        sequelize,
        modelName: "session"
    }
);

module.exports = { Session, attributes };