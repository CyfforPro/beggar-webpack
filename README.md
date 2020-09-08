# 乞丐版webpack

借助babel的一些核心包，实现对代码的解析，并转成commonjs的代码，最后自定义require和exports，使之能在浏览器中正常运行

主要步骤：

1. @babel/parser，获取某模块代码的ast
2. @babel/traverse，获取某模块代码的依赖
3. @babel/core，获取某模块代码的commonjs版本
4. 从入口文件开始递归分析，获取依赖图谱
5. 从依赖图谱生成浏览器运行代码

运行

`npm i`

`node ./webpack/compiler.js`

即可在build中发现打包后的文件main.js，该文件内容可直接在浏览器中运行



