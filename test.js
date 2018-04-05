const Promise = require("./index");

let aPromise = new Promise((resolve, reject) => {
  resolve("fulfilled");
});
aPromise
  .then(value => {
    console.log("resolve", value);
  });
