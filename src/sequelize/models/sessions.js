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
     * Check whether the user has a valid session. Will delete invalid
     * sessions unless `deleteInvalid` is false.
     * @param {string} username 
     * @param {string} uuid
     * @param {boolean} [deleteInvalid=true] Whether to delete an invalid
     * session. Mostly meant for testing purposes.
     * @returns 
     */
    static async isValidSession(username, uuid, deleteInvalid = true)
    {

        if (!(typeof username === "string")) {
            throw new TypeError("Username must be a string");
        }

        const session = await Session.findOne({ where: { username, uuid }});
        if (!session) return false;
        if (session.validUntil === null) return true;
        const now = new Date();
        const valid = (session.validUntil.getTime() - now.getTime()) > 0;
        if (!valid && deleteInvalid) await session.destroy();
        return valid;
    }

    /**
     * Invalidate the session of the user. Returns the number of
     * matching sessions that were changed.
     * @param {string} username
     * @param {string | undefined } uuid If undefined, set all
     * sessions of the user as invalid, otherwise set the one
     * matching the uuid.
     * @returns
     */
    static async setAsInvalid(username, uuid)
    {

        if (!(typeof username === "string")) {
            throw new TypeError("Username must be a string");
        }
    
        const dayBack = Date.now() - 24*60*60*1000;
        let numAffect;
        if (!uuid) {
            let rest;
            [numAffect, ...rest] = await Session.update(
                { validUntil: dayBack },
                { where: { username }}
            );
        } else {
            const session = await Session.findOne({ where: { username, uuid } });
            if (!session) return 0;
            session.validUntil = dayBack;
            await session.save();
            numAffect = 1;
        }
        return numAffect;
    }

    /**
     * Set the session of the user as valid. Returns the number of
     * matching sessions that were changed.
     * @param {string} username
     * @param {string} uuid If undefined, set all
     * sessions of the user as valid, otherwise set the one
     * matching the uuid.
     * @returns
     */
    static async setAsValid(username, uuid)
    {

        if (!(typeof username === "string")) {
            throw new TypeError("Username must be a string");
        }

        let numAffect;
        if (!uuid) {
            let rest;
            [numAffect, ...rest] = await Session.update(
                { validUntil: null },
                { where: { username }}
            );
        } else {
            const session = await Session.findOne({ where: { username, uuid } });
            if (!session) return 0;
            session.validUntil = null;
            await session.save();
            numAffect = 1;
        }
        return numAffect;
    }

    /**
     * Delete the session of the user. Returns the number of
     * matching sessions that were deleted.
     * @param {string} username
     * @param {string} uuid If undefined, delete all session of the
     * user, otherwise delete the one matching the uuid.
     * @returns
     */
    static async deleteSession(username, uuid)
    {

        if (!(typeof username === "string")) {
            throw new TypeError("Username must be a string");
        }

        let numDest;
        if (uuid) {
            numDest = await Session.destroy({ where: { username, uuid }});
        } else {
            numDest = await Session.destroy({ where: { username } });
        }
        return numDest;
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