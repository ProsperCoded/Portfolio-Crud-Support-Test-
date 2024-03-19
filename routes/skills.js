// --- DECLARATIONS

const mongoose = require("mongoose");
const app = require("express").Router();
const debug = require("debug")("app:skills");
const fs = require("fs");
const Joi = require("joi");
const _ = require("lodash");
const multer = require("multer");
const URL = require("url");
const SkillsModel = require("./../models/SkillsModel.js");
const IMAGES_ROOT = "public/tech/";
// Middle Ware

// --- MODELS ---
// const SkillsModel = require("../models/SkillsModel.js");
// mongoose.connection.addListener("connected", async () => {
//   const skills = await SkillsModel.find().populate({ path: "technology" });
//   console.log("All skills :", skills);
// });
// --- FILE UPLOAD(STORAGE) ---
const Storage = multer.memoryStorage({
  destination: IMAGES_ROOT,
  filename: (req, file, cb) => {
    cb(null, Date.now().toString() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: Storage,
  limits: {
    fileSize: 1024 * 1024 * 50,
  },
});

// Validators
function validateSkill(object) {
  const schema = Joi.object({
    mastery: Joi.alternatives()
      .try(
        Joi.array().required().items(Joi.number().integer().min(1)),
        Joi.number().required().min(1)
      )
      .required(),
    technologyId: Joi.alternatives()
      .try(
        Joi.array().required().items(Joi.string().min(1)),
        Joi.string().required().min(1).required()
      )
      .required(),
    category: Joi.alternatives()
      .try(
        Joi.array()
          .required()
          .items(Joi.string().valid("frontend", "backend", "related")),
        Joi.string().valid("frontend", "backend", "related").required()
      )
      .required(),
  });
  try {
    return schema.validate(object);
  } catch (error) {
    debug("Error In validation of Skill", error);
  }
  return schema;
}

// --- HTTP Handlers ---

app.get("/", async (req, res) => {
  const skillsCollection = await SkillsModel.find().populate({
    path: "technology",
  });
  debug("collection: ", skillsCollection);
  const skills = skillsCollection.map((skill) => {
    return {
      id: skill._id,
      mastery: skill.mastery,
      category: skill.category,
      technology: {
        id: skill.technology._id,
        name: skill.technology.name,
        image: `${req.protocol}://${req.get("host")}/${
          require("./Technologies.js").IMAGES_ROOT
        }${skill.technology.image.filename}`,
      },
    };
  });
  return res.status(200).json(skills);
});
app.post("/create", async (req, res) => {
  debug("preparing to upload skill", req.body);
  const { error } = validateSkill(req.body);
  if (error) {
    return res.status(400).send(error);
  }

  async function storeSkill(mastery, technologyId, category) {
    // console.log(technologyId);
    const newSkill = new SkillsModel({
      mastery,
      technology: mongoose.Types.ObjectId.createFromHexString(technologyId),
      category,
    });
    try {
      await newSkill.save();
      return { error: false };
    } catch (error) {
      debug(error);
      return { error: true, message: "Error occurred in saving Technologies" };
    }
  }
  if (Joi.array().validate(req.body.mastery).error) {
    req.body.mastery = [req.body.mastery];
    req.body.category = [req.body.category];
    req.body.technologyId = [req.body.technologyId];
  }

  for (let i = 0; i < req.body.mastery.length; i++) {
    let mastery = req.body.mastery[i];
    let technologyId = req.body.technologyId[i];
    let category = req.body.category[i];
    const operation = await storeSkill(mastery, technologyId, category);
    if (operation.error) {
      debug(new Error(operation.message));
      return res.status(500).json({
        message: operation.message,
      });
    }
  }

  debug("Skills created Successfully");
  res.status(200).json({
    message: "Skill was created Successfully",
  });
});
app.put("/:id", async (req, res) => {
  const id = req.params.id;
  debug(id, req.body);
  const { error } = validateSkill(req.body);
  if (error) {
    return res.status(400).send(error);
  }
  try {
    await SkillsModel.findByIdAndUpdate(id, req.body);
    res.status(200).json({
      message: "Skill updated Successfully",
    });
  } catch (error) {
    debug(new Error("Error occurred in updating Skill"));
    res.status(500).json({
      message: "Error occurred in updating Skill",
    });
  }
});
app.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await SkillsModel.findByIdAndDelete(id);
    res.status(200).json({
      message: "Skill  deleted Successfully",
    });
  } catch (error) {
    debug(new Error("Error occurred in deleting Skill"));
    res.status(500).json({
      message: "Error occurred in deleting Skill",
    });
  }
});

exports.skillsRouter = app;
