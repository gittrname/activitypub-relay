var config = require('../../settings');

module.exports = function(host) {
    var options = {
      timeout: config.queue.timeout,
    }
  
    return fetch(host, options)
      .then(function(res) {
        if (res.ok) {
          return res;
        } else {
          throw new Error(res.status + ':' + res.statusText);
        }
      });
  }