const User = require("./models/users");
const Blog = require("./models/blogs");


User.hasMany(Blog);
Blog.belongsTo(User);

module.exports = {
    User,
    Blog
}