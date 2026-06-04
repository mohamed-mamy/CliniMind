const app = require('./src/app');
console.log("Routes mounted:");
app._router.stack.forEach(layer => {
  if (layer.name === 'router') {
    console.log(layer.regexp);
  }
});
