// --- DECLARATIONS
const mongoose = require("mongoose");
const app = require("express").Router();
const debug = require("debug")("app:Tech");
const fs = require("fs");
const Joi = require("joi");
const _ = require("lodash");
const multer = require("multer");
const fileName = "image";
const URL = require("url");
const IMAGES_ROOT = "public/tech/";
// --- MODELS ---
const TechnologiesModel = require("../models/TechnologyModel.js");

// --- FILE UPLOAD(STORAGE) ---
const Storage = multer.memoryStorage({
  destination: IMAGES_ROOT,
  filename: (req, file, cb) => {
    cb(null, Date.now().toString() + "-" + file.originalname);
  },
});

// Customized setting for technologies
app.use("*", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE");
  next();
});

const upload = multer({
  storage: Storage,
  limits: {
    fileSize: 1024 * 1024 * 100,
  },
});

// Validators
function validateTechnology(object) {
  const schema = Joi.object({
    name: Joi.alternatives().try(
      Joi.array().required().min(1),
      Joi.string().required().min(1)
    ),
  });

  return schema.validate(object);
}

// --- HTTP Handlers ---

app.get("/", async (req, res) => {
  const TechCollection = await TechnologiesModel.find().select({
    _id: 1,
    name: 1,
    "image.filename": 1,
  });
  // debug(TechCollection);
  // return res.json(TechCollection);
  const Technologies = TechCollection.map((tech) => {
    return {
      id: tech._id,
      name: tech.name,
      image: `${req.protocol}://${req.get("host")}/${IMAGES_ROOT}${
        tech.image.filename
      }`,
    };
  });
  return res.status(200).json(Technologies);
});

app.post("/create", upload.array("image"), async (req, res) => {
  debug("preparing to upload", req.body, req.files);
  const { error } = validateTechnology(req.body);
  if (error) {
    return res.status(400).send(error);
  }
  async function storeFile(name, file) {
    try {
      fs.writeFile(IMAGES_ROOT + file.originalname, file.buffer, () => {
        console.log("Buffer has been written to file successfully");
      });
    } catch (error) {
      return { error: true, message: "Error occurred in uploading image" };
    }

    const newTech = new TechnologiesModel({
      name: name,
      image: {
        mimetype: file.mimetype,
        filename: file.originalname,
      },
    });
    try {
      await newTech.save();
      return { error: false };
    } catch (error) {
      debug(error);
      return { error: true, message: "Error occurred in saving Technologies" };
    }
  }
  if (Joi.array().validate(req.body.name).error) {
    req.body.name = [req.body.name];
  }
  for (let i = 0; i < req.body.name.length; i++) {
    let name = req.body.name[i];
    let file = req.files[i];
    const operation = await storeFile(name, file);
    if (operation.error) {
      debug(new Error(operation.message));
      return res.status(500).json({
        message: operation.message,
      });
    }
  }

  debug("Technology created Successfully");
  res.status(200).json({
    message: "Technology was create Successfully",
  });
});

app.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const technology = await TechnologiesModel.findByIdAndDelete(id);
    fs.rm(technology.image.filename, ()=>{
      debug('technology image deleted succesfully')
    })
    res.status(200).json({
      message: "Technology deleted Successfully",
    });
  } catch (error) {
    debug(new Error("Error occurred in deleting Technology"));
    res.status(500).json({
      message: "Error occurred in deleting Technology",
    });
  }
});

module.exports.TechnologiesRouter = app;
module.exports.IMAGES_ROOT = IMAGES_ROOT;
