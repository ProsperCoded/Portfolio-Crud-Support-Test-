const mongoose = require("mongoose");
const app = require("express").Router();
const debug = require("debug")("app:projects");
const fs = require("fs");
const Joi = require("joi");
const _ = require("lodash");
const multer = require("multer");
const fileName = "image";
const URL = require("url");
const IMAGES_ROOT = "public/projects/";
const INTERFACES_ROOT = "public/projects/interfaces/";
const ICONS_ROOT = "public/projects/icons/";

//  --- MODELS ---
const ProjectModel = require("../models/ProjectModel.js");
function uniqueFilename(f) {
  return Date.now().toString() + "-" + f;
}
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
function validateProjectCreation(object) {
  const schema = Joi.object({
    title: Joi.string().required(),
    link: Joi.string().required(),
    description: Joi.string().required(),
    // Technologies: Joi.array().items(Joi.string()),
    gitHubRepo: Joi.string().required(),
    devProcess: Joi.string().required(),
    technologiesId: Joi.array().required().items(Joi.string()),
  });
  return schema.validate(object);
}
app.get("/", async (req, res) => {
  const projectsCollection = await ProjectModel.find().populate({
    path: "technologies",
  });

  // return res.status(200).json(projectsCollection);
  const projects = projectsCollection.map((project) => {
    return {
      title: project.title,
      gitHubRepo: project.gitHubRepo,
      link: project.link,
      description: project.description,
      devProcess: project.devProcess,
      technologies: project.technologies.map((tech) => {
        return {
          id: tech._id,
          name: tech.name,
          image: `${req.protocol}://${req.get("host")}/${
            require("./Technologies.js").IMAGES_ROOT
          }${tech.image.filename}`,
        };
      }),
      // ...project,
      id: project._id,
      icon: `${req.protocol}://${req.get("host")}/${ICONS_ROOT}${
        project.icon.filename
      }`,
      interface: `${req.protocol}://${req.get("host")}/${INTERFACES_ROOT}${
        project.interface.filename
      }`,
    };
  });
  return res.status(200).json(projects);
});
app.post(
  "/create",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "interface", maxCount: 1 },
  ]),
  async (req, res) => {
    debug("preparing to upload", req.body, req.files);
    const { error } = validateProjectCreation(req.body);
    if (error) {
      return res.status(400).send(error);
    }
    const icon = req.files["icon"][0];
    icon.filename = uniqueFilename(icon.originalname);
    const _interface = req.files["interface"][0];
    _interface.filename = uniqueFilename(_interface.originalname);
    // Storing files
    try {
      fs.writeFile(ICONS_ROOT + icon.filename, icon.buffer, () => {
        console.log("Icon Buffer has been written to file successfully");
      });

      fs.writeFile(
        INTERFACES_ROOT + _interface.filename,
        _interface.buffer,
        () => {
          console.log("interface Buffer has been written to file successfully");
        }
      );
    } catch (error) {
      debug("Error occurred in uploading Images For project(icon, interface)");
      return res.json({
        error: true,
        message:
          "Error occurred in uploading Images For project(icon, interface)",
      });
    }
    let TechIds;
    try {
      TechIds = req.body.technologiesId.map((id) =>
        mongoose.Types.ObjectId.createFromHexString(id)
      );
    } catch (error) {
      return res.status(400).json({
        message: "One of the Technology isn't valid",
      });
    }
    const newProject = new ProjectModel({
      title: req.body.title,
      link: req.body.link,
      description: req.body.description,
      gitHubRepo: req.body.gitHubRepo,
      devProcess: req.body.devProcess,
      icon: {
        filename: icon.filename,
        mimetype: icon.mimetype,
      },
      interface: {
        filename: _interface.filename,
        mimetype: _interface.mimetype,
      },
      technologies: TechIds,
    });
    try {
      await newProject.save();
    } catch (error) {
      console.error(new Error("Error occurred in saving project"), error);
      return res.status(500).json({
        message: "Error occurred in saving skill",
      });
    }

    debug("Project created Successfully");
    res.status(200).json({
      message: "Project was created Successfully",
    });
  }
);

app.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const project = await ProjectModel.findByIdAndDelete(id);
    fs.rm(ICONS_ROOT + project.icon.filename, () => {
      debug("Project icon deleted successfully");
    });
    fs.rm(INTERFACES_ROOT + project.interface.filename, () => {
      debug("Project interface deleted successfully");
    });
    return res.status(200).json({
      message: "Project deleted Successfully",
    });
  } catch (error) {
    debug(new Error("Error occurred in deleting Project"));
    res.status(500).json({
      message: "Error occurred in deleting Project",
    });
  }
});
app.put(
  "/:id",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "interface", maxCount: 1 },
  ]),

  async (req, res) => {
    // debug("preparing to update", req.body, req.files);
    debug("files details", req.files);
    const id = req.params.id;
    const { error } = validateProjectCreation(req.body);
    if (error) {
      return res.status(400).send(error);
    }

    const project = await ProjectModel.findById(id);
    project.title = req.body.title;
    project.link = req.body.link;
    project.description = req.body.description;
    project.gitHubRepo = req.body.gitHubRepo;
    project.devProcess = req.body.devProcess;

    try {
      let TechIds = req.body.technologiesId.map((id) =>
        mongoose.Types.ObjectId.createFromHexString(id)
      );
      project.technologies = TechIds;
    } catch (error) {
      return res.status(400).json({
        message: "a Technology is not valid",
      });
    }
    if (req.files && req.files["icon"]) {
      const icon = req.files["icon"][0];
      icon.filename = uniqueFilename(icon.originalname);
      fs.writeFile(ICONS_ROOT + icon.filename, icon.buffer, () => {
        console.log("Icon Buffer has been written to file successfully");
      });
      project.icon = {
        filename: icon.filename,
        mimetype: icon.mimetype,
      };
    }
    if (req.files && req.files["interface"]) {
      const _interface = req.files["interface"][0];
      _interface.filename = uniqueFilename(_interface.originalname);
      fs.writeFile(
        INTERFACES_ROOT + _interface.filename,
        _interface.buffer,
        () => {
          console.log("interface Buffer has been written to file successfully");
        }
      );
      project.interface = {
        filename: _interface.filename,
        mimetype: _interface.mimetype,
      };
    }
    try {
      // let icon =
      await project.save();
    } catch (error) {
      debug(new Error("Error occurred in updating Project"));
      return res.status(500).json({
        message: "Error occurred in updating Project",
      });
    }
    return res.status(200).json({
      message: "Project updated Successfully",
    });
  }
);
module.exports.ProjectRouter = app;
module.exports.INTERFACES_ROOT = INTERFACES_ROOT;

module.exports.ICONS_ROOT = ICONS_ROOT;
