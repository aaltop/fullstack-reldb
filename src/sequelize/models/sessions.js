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
    },
    {
        uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4
        }
    }
];

class Session extends Model {

    /**
     * Check whether the user has a valid session.
     * @param {string} username 
     * @param {string} uuid 
     * @returns 
     */
    static async isValidSession(username, uuid)
    {
        const session = await Session.findOne({ where: { username, uuid }});
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
     * @param {string | undefined } uuid If undefined, set all
     * sessions of the user as invalid, otherwise set the one
     * matching the uuid.
     * @returns
     */
    static async setAsInvalid(username, uuid)
    {
    
        const dayBack = Date.now() - 24*60*60*1000;
        if (!uuid) {
            await Session.update(
                { validUntil: dayBack },
                { where: { username }}
            );
        } else {
            const session = await Session.findOne({ where: { username, uuid } });
            if (!session) return false;
            session.validUntil = dayBack;
            await session.save();
        }
        return true;
    }

    /**
     * Set the session of the user as valid. If a matching session
     * is not found, return false.
     * @param {string} username
     * @param {string} uuid If undefined, set all
     * sessions of the user as valid, otherwise set the one
     * matching the uuid.
     * @returns
     */
    static async setAsValid(username, uuid)
    {
        if (!uuid) {
            await Session.update(
                { validUntil: null },
                { where: { username }}
            );
        } else {
            const session = await Session.findOne({ where: { username, uuid } });
            if (!session) return false;
            session.validUntil = null;
            await session.save();
        }
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