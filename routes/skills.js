const mongoose = require("mongoose");
const { DefaultSerializer } = require("v8");
const app = require("express").Router();
const debug = require("debug")("app:skills");
const schema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // file: {
  //   type: String,
  //   required: true,
  // },
});

const Course = new mongoose.model("skills", schema);

app.get("/", (req, res) => {
  res.send("Skills");
});

exports.skillsRouter = app;
