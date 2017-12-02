var path  = require('path');
var mysql = require('mysql');

var config = {};

var update = function() {
    var connection = mysql.createConnection(config);

    connection.connect();

    connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
      if (error) throw error;
      console.log('The solution is: ', results[0].solution);
    });

    connection.end();
};


module.exports = function(param){

    var configFilename = path.resolve(path.dirname(module.parent.filename), param);
        config = require(configFilename);

    return {
        update
    };

};