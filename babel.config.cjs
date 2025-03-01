module.exports = {
    presets: [["@babel/preset-env", { targets: { node: "current" }, modules: "auto" }]],
    plugins: [
        ["@babel/plugin-syntax-import-attributes", { deprecatedAssertSyntax: true }],
        ["babel-plugin-transform-import-meta", { module: "ES6" }],
    ],
};
