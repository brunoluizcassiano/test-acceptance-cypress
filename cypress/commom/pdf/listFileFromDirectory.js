const fs = require("fs");
const path = require("path");

async function listFilesFromDirectory(directory, files) {
  if (!files) files = [];

  let FileList = fs.readdirSync(path.resolve(__dirname, directory));
  for (let k in FileList) {
    let stat = fs.statSync(
      `${path.resolve(__dirname, directory)}/${FileList[k]}`
    );
    if (stat.isDirectory())
      await listFilesFromDirectory(directory + "/" + FileList[k], files);
    else files.push(FileList[k]);
  }

  return files;
}

async function fileImg(testCaseKey) {
  let files = await listFilesFromDirectory(
    `../../../../../temp/screenshots/${testCaseKey}`
  );

  let img = [];

  for (i = 0; i < files.length; i++) {
    if (img === undefined) {
      img = {
        image: `data:image/png;base64, ${require("fs")
          .readFileSync(
            path.resolve(
              __dirname,
              `../../../../../temp/screenshots/${testCaseKey}/` + files[i]
            )
          )
          .toString("base64")}`,
        height: 350,
        width: 500,
        margin: [0, 20, 0, 0],
        alignment: "center",
      };
    } else {
      img = img.concat({
        image: `data:image/png;base64, ${require("fs")
          .readFileSync(
            path.resolve(
              __dirname,
              `../../../../../temp/screenshots/${testCaseKey}/` + files[i]
            )
          )
          .toString("base64")}`,
        height: 350,
        width: 500,
        margin: [0, 20, 0, 0],
        alignment: "center",
      });
    }
  }

  return img;
}

module.exports = { fileImg };
