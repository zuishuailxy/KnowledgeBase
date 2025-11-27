import swc from "@swc/core"


const res = swc.transformFileSync('./app.jsx', {
  jsc: {
    parser: {
      syntax: "ecmascript",
      jsx:true
    },
    target:"es5",
  },
  minify: false
})

console.log(res.code);
