const mongoose = require("mongoose");
const TechnologiesSchema = mongoose.Schema({
  // Ensure to index the name
  name: {
    type: String,
    unique: true,
    required: true,
  },
  image: {
    // file: Buffer,
    filename: String,
    mimetype: String,
  },
});
module.exports = TechnologiesModel = mongoose.model(
  "technologies",
  TechnologiesSchema
);
