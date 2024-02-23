const fs = require("fs");
// module.exports.ls_files = function ls_files(dirPath) {
//   let files = fs.readdirSync(dirPath, (err, files) => {
//     if (err) {
//       console.error("Error reading directory:", err);
//       return;
//     }
//     return files;
//   });
//   console.log(files);
//   return files;
// };

console.log(fs.readdirSync("./public"));
