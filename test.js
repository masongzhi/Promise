const Promise = require("./index");

Promise.deferred = function() {
  let dfd = {};
  dfd.promise = new Promise(function(resolve, reject) {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

module.exports = Promise;
