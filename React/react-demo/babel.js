import babel from '@babel/core'
import presetEnv from '@babel/preset-env'
import react from '@babel/preset-react'
import fs from 'node:fs'

// 
const transformFunc = ({types: t}) => {
  return {
    name: "transformFunc",
    visitor: {
      // 匹配 箭头函数
      ArrowFunctionExpression(path) {
        // 箭头函数转为普通函数
        const node = path.node
        const func = t.functionExpression(
          null,
          node.params,
          t.blockStatement([t.returnStatement(node.body)]),
          node.async
        )

        path.replaceWith(func)
      }
    }
  }
}


const code = fs.readFileSync('./test.js', 'utf8')
// console.log(code)
const res = babel.transform(code, {
  presets: [
    [presetEnv, { useBuiltIns: 'usage' , corejs: 3}],
    react
  ],
  plugins:[transformFunc]
})
console.log(res.code)