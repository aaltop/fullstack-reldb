const { User } = require("./models/users.js");
const { Blog } = require("./models/blogs.js");
const { ReadingList } = require("./models/reading_list.js");
const { Session } = require("./models/sessions.js");


User.hasMany(Blog);
Blog.belongsTo(
    User,
    {
        foreignKey: {
            allowNull: false
        }
    }
);

User.hasMany(ReadingList);
ReadingList.belongsTo(User);
Blog.hasMany(ReadingList);
ReadingList.belongsTo(Blog);

User.hasMany(
    Session,
    {
        sourceKey: "username",
        foreignKey: "username",
        allowNull: false,
    }
);
Session.belongsTo(
    User,
    {
        targetKey: "username",
        foreignKey: "username",
        allowNull: false
    }
);

module.exports = {
    User, Blog, ReadingList, Session
}