const User = require("./models/users");
const Blog = require("./models/blogs");


User.hasMany(Blog);
Blog.belongsTo(
    User,
    {
        foreignKey: {
            allowNull: false
        }
    }
);

module.exports = {
    User,
    Blog
}