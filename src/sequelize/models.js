const { User } = require("./models/users.js");
const { Blog } = require("./models/blogs.js");
const { ReadingList } = require("./models/reading_list.js");


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

module.exports = {
    User, Blog, ReadingList
}