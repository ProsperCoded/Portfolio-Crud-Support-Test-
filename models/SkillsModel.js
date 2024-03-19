const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;
const SkillSchema = mongoose.Schema({
  // _id: ObjectId,
  // index: { type: Number, required: true },
  mastery: {
    type: Number,
    required: true,
    max: 100,
    min: 0,
  },
  technology: {
    type: ObjectId,
    ref: "technologies",
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["frontend", "backend", "related"],
  },
});

module.exports = SkillModel = mongoose.model("skills", SkillSchema);
