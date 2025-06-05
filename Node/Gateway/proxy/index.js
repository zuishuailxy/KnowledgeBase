export default [
  {
    upstream: "http://localhost:3000", // Change this to your target service
    prefix: "/pc", // Proxy all requests starting with /pc
    rewritePrefix: "/",
    httpMethods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    http2: false,
  },
  {
    upstream: "http://localhost:4000", // Change this to your target service
    prefix: "/mobile", // Proxy all requests starting with /mobile
    rewritePrefix: "/",
    httpMethods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    http2: false,
  },
];
