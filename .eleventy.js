const normalizePathPrefix = (value) => {
  const trimmed = (value || "/").trim();

  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, "");
  return `/${withoutSlashes}/`;
};

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  const pathPrefix = normalizePathPrefix(process.env.ELEVENTY_PATH_PREFIX || "/");

  return {
    pathPrefix,
    dir: {
      input: "src",
      includes: "partials",
      data: "data",
      output: "dist"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
