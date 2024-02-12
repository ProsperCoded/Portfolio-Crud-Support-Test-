// const debugApp = require('debug')
const express = require("express");
const app = express();
const router = express.Router();
app.use(express.json());
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  console.log("new connection received from ");
  next();
});
const users = [
  {
    id: 1,
    name: "John",
    email: "<EMAIL>",
    password: "<PASSWORD>",
  },
  {
    id: 2,
    name: "Prosper",
    email: "<EMAIL>",
    password: "<PASSWORD>",
  },
  {
    id: 3,
    name: "Seun",
    email: "<EMAIL>",
    password: "<PASSWORD>",
  },
  {
    id: 4,
    name: "Tochukwu",
    email: "<EMAIL>",
    password: "<PASSWORD>",
  },
];
router.get("/", (req, res) => {
  res.status(200);
  res.send(users);
  console.log("sent response ");
});
app.use("/", router);
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
