const path = require("path");
const fs = require("fs");
const { getAst, getDependencies, getCode } = require("./analysis");
const configPath = "../webpack.config";
const options = require(configPath);

class Compiler {
  constructor(options) {
    const { entry, output } = options;
    this.entry = entry; // 入口
    this.output = output; // 输出
    this.modules = []; // 模块
  }
  // 分析filename的ast/dependency/code
  analysis(filename) {
    const ast = getAst(filename);
    const dependencies = getDependencies(ast, filename);
    const code = getCode(ast);
    return {
      filename, // 文件路径，可以作为每个模块的唯一标识
      dependencies,
      code,
    };
  }
  //
  run() {
    // 从入口开始分析
    const entryDir = path.dirname(configPath); // ".."
    // path.join("..", "./src/index.js") = "../src/index.js"
    const relativeEntry = path.posix.join(entryDir, this.entry);
    const info = this.analysis(relativeEntry);

    this.modules.push(info);
    // 用for而不是forEach，这样对于依赖的依赖，也能处理到，this.modules是动态增长的
    for (let i = 0; i < this.modules.length; i++) {
      const { dependencies } = this.modules[i];
      // 若有依赖，递归分析所有依赖模块
      if (dependencies) {
        for (const dependency in dependencies) {
          this.modules.push(this.analysis(dependencies[dependency]));
        }
      }
    }

    // 生成依赖关系图dependencyGraph
    const dependencyGraph = this.modules.reduce(
      (graph, module) => ({
        ...graph,
        // 文件路径作为唯一标识，保存对应模块的依赖和文件内容
        [module.filename]: {
          dependencies: module.dependencies,
          code: module.code,
        },
      }),
      {}
    );
    /* 
    dependencyGraph长这样
    {
      '../src/index.js': {
        dependencies: { './a.js': '../src/a.js', './b/b.js': '../src/b/b.js' },
        code: '"use strict";\n' +
          '\n' +
          'var _a = _interopRequireDefault(require("./a.js"));\n' +
          '\n' +
          'var _b = _interopRequireDefault(require("./b/b.js"));\n' +
          '\n' +
          'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\n' +
          '\n' +
          'console.log("index.js", _a["default"], _b["default"]);'
      },
      '../src/a.js': {
        dependencies: {},
        code: '"use strict";\n' +
          '\n' +
          'Object.defineProperty(exports, "__esModule", {\n' +
          '  value: true\n' +
          '});\n' +
          'exports["default"] = void 0;\n' +
          'var a = "a";\n' +
          'console.log("module a");\n' +
          'var _default = a;\n' +
          'exports["default"] = _default;'
      },
      '../src/b/b.js': {
        dependencies: {},
        code: '"use strict";\n' +
          '\n' +
          'Object.defineProperty(exports, "__esModule", {\n' +
          '  value: true\n' +
          '});\n' +
          'exports["default"] = void 0;\n' +
          'var b = "b";\n' +
          'console.log("module b");\n' +
          'var _default = b;\n' +
          'exports["default"] = _default;'
      }
    }
    */

    this.generate(dependencyGraph);
  }
  // 重写require及处理exports，输出bundle
  generate(dependencyGraph) {
    const bundle = `
      (
        function(dependencyGraph) {
          // 找到moduleId对应的依赖对象，调用require函数，eval执行，拿到exports对象
          function require(moduleId) {
            function localRequire(relativePath) {
              // 返回的结果，如../src/a.js —— {__esModule: true, default: 'a'}
              return require(dependencyGraph[moduleId].dependencies[relativePath])
            }
            // 因为code是commonjs的语法，对于浏览器而言，缺少require和exports，需要在外面传入
            var exports = {};
            (function(require, exports, code) {
              eval(code)
            })(localRequire, exports, dependencyGraph[moduleId].code);
            // 对于每一个依赖，需要导出其实现的结果exports对象
            return exports;
          }
          require('${Object.keys(dependencyGraph)[0]}')
        }
      )(${JSON.stringify(dependencyGraph)})
    `;
    // 写入output的文件中
    const outputFilePath = path.join(this.output.path, this.output.filename);
    const dirname = path.dirname(outputFilePath);
    if (fs.existsSync(dirname)) {
      fs.writeFileSync(outputFilePath, bundle, "utf8");
    } else {
      fs.mkdir(dirname, (err) => {
        if (!err) {
          fs.writeFileSync(outputFilePath, bundle, "utf8");
        } else {
          console.log(err);
        }
      });
    }
  }
}

new Compiler(options).run();
