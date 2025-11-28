let { a, b } = require("./test.cjs");
b.push(45);
a = 5;
// console.log('test2', a, JSON.stringify(b))
module.exports = {
  b,
  a,
};
