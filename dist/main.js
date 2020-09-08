
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
          require('../src/index.js')
        }
      )({"../src/index.js":{"dependencies":{"./a.js":"../src/a.js","./b/b.js":"../src/b/b.js"},"code":"\"use strict\";\n\nvar _a = _interopRequireDefault(require(\"./a.js\"));\n\nvar _b = _interopRequireDefault(require(\"./b/b.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nconsole.log(\"index.js\", _a[\"default\"], _b[\"default\"]);"},"../src/a.js":{"dependencies":{},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\nvar a = \"a\";\nconsole.log(\"module a\");\nvar _default = a;\nexports[\"default\"] = _default;"},"../src/b/b.js":{"dependencies":{},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\nvar b = \"b\";\nconsole.log(\"module b\");\nvar _default = b;\nexports[\"default\"] = _default;"}})
    