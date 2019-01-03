function Promise(executor) {
  var self = this;
  self.value = undefined;
  self.reason = undefined;
  self.status = "pending";
  self.onFulfilledCallbacks = [];
  self.onRejectedCallbacks = [];
  function resolve(value) {
    if (value instanceof Promise) {
      return value.then(resolve, reject);
    }

    setTimeout(function() {
      if (self.status === "pending") {
        self.status = "fulfilled";
        self.value = value;
        self.onFulfilledCallbacks.forEach(function(item) {
          item(self.value);
        });
      }
    });
  }
  function reject(reason) {
    setTimeout(function() {
      if (self.status === "pending") {
        self.status = "rejected";
        self.reason = reason;
        self.onRejectedCallbacks.forEach(function(item) {
          item(self.reason);
        });
      }
    });
  }

  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    // 如果从onFulfilled中返回的x 就是promise2 就会导致循环引用报错
    return reject(new TypeError("循环引用"));
  }
  let called = false; // 避免多次调用
  // 这一段可以和下面thenable合并，单独出来更容易理解
  if (x instanceof Promise) {
    // 获得它的终值 继续resolve
    if (x.status === "pending") {
      // 如果为等待态需等待直至 x 被执行或拒绝 并解析y值
      x.then(
        function(y) {
          resolvePromise(promise2, y, resolve, reject);
        },
        function(reason) {
          reject(reason);
        }
      );
    } else {
      // 如果 x 已经处于执行态/拒绝态(值已经被解析为普通值)，用相同的值执行传递下去 promise
      x.then(resolve, reject);
    }
    // 如果 x 为对象或者函数
  } else if (x != null && (typeof x === "object" || typeof x === "function")) {
    try {
      // 是否是thenable对象（具有then方法的对象/函数）
      let then = x.then;
      if (typeof then === "function") {
        then.call(
          x,
          function(y) {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          function(reason) {
            if (called) return;
            called = true;
            reject(reason);
          }
        );
      } else {
        // 说明是一个普通对象/函数
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    resolve(x);
  }
}

Promise.prototype.then = function(onFulfilled, onRejected) {
  var self = this;
  var promise2;
  onFulfilled =
    typeof onFulfilled === "function"
      ? onFulfilled
      : function(value) {
          return value;
        };
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : function(err) {
          throw err;
        };

  if (self.status === "fulfilled") {
    return (promise2 = new Promise(function(resolve, reject) {
      setTimeout(function() {
        try {
          var x = onFulfilled(self.value);
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }));
  }
  if (self.status === "rejected") {
    return (promise2 = new Promise(function(resolve, reject) {
      setTimeout(function() {
        try {
          var x = onRejected(self.reason);
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }));
  }
  if (self.status === "pending") {
    return (promise2 = new Promise(function(resolve, reject) {
      self.onFulfilledCallbacks.push(function(value) {
        try {
          var x = onFulfilled(value);
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
      self.onRejectedCallbacks.push(function(reason) {
        try {
          var x = onRejected(reason);
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }));
  }
};

module.exports = Promise;
