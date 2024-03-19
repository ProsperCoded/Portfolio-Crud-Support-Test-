const mongoose = require("mongoose");
const app = require("express").Router();
const debug = require("debug")("app:auth");
const fs = require("fs");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const AuthAdminModel = require("../models/AuthAdminModel");
const cookie = require("cookie");
// const jwt = require("jsonwebtoken");
dotenv.config();
const SALT = bcrypt.genSaltSync(parseInt(process.env.SALT_TOKEN));
const jwt = require("jsonwebtoken");
// Check important environment variables
if (!process.env.JWT_PRIVATE_KEY) {
  debug("JWT_PRIVATE_KEY, env is not defined");
  process.exit(1);
}
function validationAdmin(object) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  try {
    const result = schema.validate(object);
    return result;
  } catch (error) {
    debug("An error occured in validation of admin");
    console.error(error);
  }
}
app.post("/register", async (req, res) => {
  const { error } = validationAdmin(req.body);
  if (error) {
    return res.status(400).send(error);
  }
  let password = req.body.password;
  let username = req.body.username;

  if (await AuthAdminModel.findOne({ username })) {
    return res.status(400).json({
      message: "Username already exists",
    });
  }
  const pass_hashed = await bcrypt.hash(password, SALT);
  const admin = new AuthAdminModel({
    username,
    password: pass_hashed,
  });
  try {
    await admin.save();
  } catch (error) {
    debug(new Error("Error occurred in saving admin"));
    console.error(error);
    return res.status(500).json({
      message: "Error occurred in saving admin",
    });
  }
  const token = jwt.sign({ _id: admin._id }, process.env.JWT_PRIVATE_KEY);

  res.setHeader("x-auth-token", token);
  return res.status(200).json({
    message: "You are registered as an admin successfully",
  });
});
app.post("/auto-login", async (req, res) => {
  let token = req.headers["x-auth-token"];
  debug("auto-login received a request");
  if (token && token != "null") {
    const authorization = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    if (authorization.isAdmin) {
      return res.json({ message: "verified" });
    }
  }
  return res.status(400).json({
    message: "Invalid token",
  });
});
app.post("/login", async (req, res) => {
  const { error } = validationAdmin(req.body);
  if (error) {
    return res.status(400).send(error);
  }
  let password = req.body.password;
  let username = req.body.username;
  const admin = await AuthAdminModel.findOne({
    username,
  });
  if (!admin) {
    debug("Invalid username or password");
    return res.status(400).json({
      message: "Invalid username or password *",
    });
  }
  const validAdmin = await bcrypt.compare(password, admin.password);
  if (validAdmin) {
    const token = jwt.sign(
      { _id: admin._id, isAdmin: true },
      process.env.JWT_PRIVATE_KEY
    );
    res.setHeader("x-auth-token", token);
    return res.status(200).json({
      message: "Login successfully",
    });
  }
  debug("Invalid username or password");
  return res.status(400).json({
    message: "Invalid username or password",
  });
});
app.delete("/unused", async (req, res) => {
  // Delete Unused Projects Files
  let ProjectModel = require("./../models/ProjectModel");
  let { ICONS_ROOT } = require("./Projects.js");
  let { INTERFACES_ROOT } = require("./Projects.js");
  const projects = await ProjectModel.find();
  let activeInterfaces = [];
  let activeIcons = [];
  let ICONS_DIR_FILES = fs.readdirSync(ICONS_ROOT);
  let INTERFACE_DIR_FILES = fs.readdirSync(INTERFACES_ROOT);
  projects.forEach((p) => {
    activeInterfaces.push(p.interface.filename);
    activeIcons.push(p.icon.filename);
  });
  ICONS_DIR_FILES.forEach((f) => {
    if (!activeIcons.includes(f)) {
      fs.rmSync(ICONS_ROOT + f);
    }
  });
  INTERFACE_DIR_FILES.forEach((f) => {
    if (!activeInterfaces.includes(f)) {
      fs.rmSync(INTERFACES_ROOT + f);
    }
  });

  let { IMAGES_ROOT } = require("./Technologies.js");
  let TechnologiesModel = require("./../models/TechnologyModel.js");
  let TECHNOLOGIES_DIR_FILES = fs.readdirSync(IMAGES_ROOT);
  const technologies = await TechnologiesModel.find();
  const activeTechImages = technologies.map((t) => t.image.filename);
  TECHNOLOGIES_DIR_FILES.forEach((f) => {
    if (!activeTechImages.includes(f)) {
      fs.rmSync(f);
    }
  });
  res.send("deleted unused  files");
});
function genCookieString(token, duration = -1, name, ...options) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + duration);

  const cookieOptions = {
    secureCookie: false,
    httpOnly: false,
    expires: expirationDate,
    ...options,
  };
  const cookieString = cookie.serialize(name, token, cookieOptions);
  return cookieString;
}
module.exports.AuthRouter = app;
