const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  imageUrl: String,
  caption: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;