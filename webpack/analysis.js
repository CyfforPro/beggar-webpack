const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAst } = require("@babel/core");

/**
 * 获取AST
 * @param {*} path 要分析的文件路径
 */
function getAst(path) {
  const content = fs.readFileSync(path, "utf-8");
  // 将文件内容转为AST
  return parser.parse(content, {
    sourceType: "module",
  });
}

/**
 * 获取依赖
 * @param {*} ast
 * @param {*} filename
 */
function getDependencies(ast, filename) {
  const dependencies = {};
  // 遍历所有import，存入dependencies
  traverse(ast, {
    // 类型为ImportDeclaration的AST节点（即import语句）
    ImportDeclaration({ node }) {
      // 将如../a.js换成相对于compiler.js的相对路径，便于后续生成依赖关系图
      const filepath = path.posix.join(
        path.dirname(filename),
        node.source.value
      );
      dependencies[node.source.value] = filepath;
    },
  });
  return dependencies;
}

/**
 * 从AST生成code
 * @param {*} ast
 */
function getCode(ast) {
  const { code } = transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],
  });
  return code;
}

module.exports = {
  getAst,
  getDependencies,
  getCode,
};
