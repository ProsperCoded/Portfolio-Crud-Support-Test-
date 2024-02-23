const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const ProjectSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    // maxLength: 500,
  },
  devProcess: {
    type: String,
    required: true,
  },
  gitHubRepo: {
    type: String,
    required: true,
  },
  technologies: [{ type: ObjectId, ref: "Technologies", required: true }],
  icon: {
    filename: String,
    mimetype: String,
  },
  interface: {
    filename: String,
    mimetype: String,
  },
});
// const Image = mongoose.model('Image', ImageSchema);
module.exports = ProjectModel = mongoose.model("Projects", ProjectSchema);
