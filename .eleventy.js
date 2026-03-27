const normalizePathPrefix = (value) => {
  const trimmed = (value || "/").trim();

  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, "");
  return `/${withoutSlashes}/`;
};

const normalizeOutputDir = (value) => {
  const trimmed = (value || "dist").trim();
  const normalized = trimmed.replace(/^[\\/]+|[\\/]+$/g, "");
  return normalized || "dist";
};

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets/css": "assets/css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/img/work": "assets/img/work" });
  eleventyConfig.addPassthroughCopy("src/assets/img/*.png");
  eleventyConfig.addPassthroughCopy("src/assets/img/*.jpg");
  eleventyConfig.addPassthroughCopy("src/assets/img/*.webp");
  eleventyConfig.addPassthroughCopy("src/assets/img/*.svg");
  eleventyConfig.addPassthroughCopy("src/assets/img/*.ico");

  const pathPrefix = normalizePathPrefix(process.env.ELEVENTY_PATH_PREFIX || "/");
  const outputDir = normalizeOutputDir(process.env.ELEVENTY_OUTPUT_DIR || "dist");

  return {
    pathPrefix,
    dir: {
      input: "src",
      includes: "partials",
      data: "data",
      output: outputDir
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
