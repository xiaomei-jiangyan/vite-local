let a = 1;
const b = [];

// console.log('test', a, JSON.stringify(b))
setTimeout(() => {
  // console.log('test timeout', a, JSON.stringify(b))
}, 2000);
module.exports = {
  a,
  b,
};
