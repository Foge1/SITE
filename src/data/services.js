const fs = require("fs");
const path = require("path");

const servicesDir = path.join(__dirname, "services");

const items = fs
  .readdirSync(servicesDir)
  .filter((fileName) => fileName.endsWith(".json"))
  .sort()
  .map((fileName) => require(path.join(servicesDir, fileName)));

module.exports = { items };
