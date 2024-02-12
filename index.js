const debugApp = require("debug")("app: index");
const express = require("express");
const dotenv = require("dotenv");
const app = express();
const mongoose = require("mongoose");

// -- ROUTES ---
const { skillsRouter } = require("./routes/skills.js");

app.use(express.json());

dotenv.config();
const connectionString = process.env.DB_STRING;
const PORT = process.env.PORT || 3000;

mongoose
  .connect(connectionString, {
    autoIndex: true,
  })
  .then((msg) => {
    console.log("Successfully Connected to MongoDB !!!");
  })
  .catch((err) => {
    console.log("An Error Occurred ", err);
  });

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  console.log("new connection received");
  next();
});

app.get("/", (req, res) => {
  res.status(200);
  res.send("This is an majorly an api to support prospercoded website ");
  console.log("sent response ");
});

app.use("/skills", skillsRouter);

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

exports.default = app;
