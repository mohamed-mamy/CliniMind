const app = require('./src/app');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.path)
  }
  if (r.name === 'router') {
    console.log("Router mounted on:", r.regexp);
  }
})
