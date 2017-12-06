var path  = require('path');
var fs    = require('fs');
var mysql = require('mysql');

var connection;

var updatefolder = '';
var updates = [];

var scripts = {};
scripts.create_t_updatescripts =
`
CREATE TABLE IF NOT EXISTS \`test\`.\`t_updatescripts\` (
  \`updatescriptid\` INT NOT NULL,
  \`dateiname\` VARCHAR(300) NULL,
  PRIMARY KEY (\`updatescriptid\`)
);

select 
  coalesce(max(t.updatescriptid), 0) as updatescriptid
from t_updatescripts t;
`;

var initConnection = function(config) {
    connection = mysql.createConnection(config);
    connection.config.queryFormat = function (query, values) {
      if (!values) return query;
      return query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
          return this.escape(values[key]);
        }
        return txt;
      }.bind(this));
    };
};

var execUpdate = function(updatescriptid) {
    var scriptname = updates.find( name => new RegExp(`^update0{0,3}${updatescriptid}_\\w*\\.sql$`, 'g').test(name))
    console.log(`spiele Script ${updatescriptid} (${scriptname}) ein...`);
};


var update = function() {

    connection.connect();

    connection.query(scripts.create_t_updatescripts, function (error, results, fields) {
        if (error) throw error;
        var akt_updateid = results[1][0].updatescriptid;

        if(akt_updateid === updates.length) {
            console.log("Alle Updates eingespielt!");
        } else if(akt_updateid < updates.length) {
            execUpdate(akt_updateid + 1);
        }
    });

    connection.end();
};


module.exports = function(param){

    var configFilename = path.resolve(path.dirname(module.parent.filename), param);
    var config = require(configFilename);

    updatefolder = path.resolve(path.dirname(module.parent.filename), config.updatefolder);
    
    updates = fs.readdirSync(updatefolder);

    initConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
        multipleStatements: true
    });

    return {
        update
    };

};