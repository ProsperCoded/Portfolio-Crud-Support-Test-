// -- DECLARATIONS
const debug = require("debug")("app: index");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const mongoose = require("mongoose");
// -- ROUTES ---
const { skillsRouter } = require("./routes/skills.js");
// const { TechnologiesRouter } = require("./routes/Technologies.js");
const { TechnologiesRouter } = require("./routes/Technologies.js");
const { ProjectRouter } = require("./routes/Projects.js");
const { AuthRouter } = require("./routes/AuthAdmin.js");

const connectionString = process.env.DB_STRING;
const PORT = process.env.PORT || 3000;

mongoose
  .connect(connectionString, {
    autoIndex: true,
  })
  .then(() => {
    console.log("Successfully Connected to MongoDB !!!");
  })
  .catch((err) => {
    console.log("An Error Occurred ", err);
  });

// --- MIDDLE WARES ----
app.use("*", (req, res, next) => {
  debug("New connection made in middleware");
  // Set Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  // res.setHeader("access-control-expose-headers", "true");
  res.setHeader("Access-Control-Expose-Headers", "x-auth-token");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "*"
    // "content-custom"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", 3600);
  // Handle preflight requests (OPTIONS method)
  if (req.method === "OPTIONS") {
    // Respond successfully to preflight requests
    debug("running preflight");
    res.status(200);
    return res.end();
  }

  next();
});
// For Express protocol setting
app.set("trust proxy", true);

app.use(cookieParser());
app.use(bodyParser.json());
// disable the function below first to just test what happens without it.
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// --- HTTP Handlers ---
app.use(express.json());
// Setting public directory
// app.use("/public", express.static("public/"));
express.static(path.join(__dirname, "public"));
app.get("/", (req, res) => {
  res.status(200);
  res.send(
    "This is an majorly an api to support Prosper Coded website visit the website here https://prospercoded.com"
  );
});

// --- LISTENER & ROUTERS---
app.use("/skills", skillsRouter);
app.use("/technologies", TechnologiesRouter);
app.use("/projects", ProjectRouter);
app.use("/admin", AuthRouter);
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

module.exports.default = app;
