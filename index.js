var path  = require('path');
var fs    = require('fs');
var mysql = require('mysql');

var connection;

var updatefolder = '';
var updates = [];

var scripts = {};
// Erzeugt gegebenfalls die Updatescript-Tabelle und gibt den aktuellen Stand zurück
scripts.create_t_updatescripts =
`
CREATE TABLE IF NOT EXISTS \`t_updatescripts\` (
  \`updatescriptid\` INT NOT NULL,
  \`dateiname\` VARCHAR(300) NULL,
  PRIMARY KEY (\`updatescriptid\`)
);

select 
  coalesce(max(t.updatescriptid), 0) as updatescriptid
from t_updatescripts t;
`;

var initModule = function(param) {

    var configFilename = path.resolve(process.cwd(), param);
    var config = require(configFilename);

    updatefolder = path.resolve(process.cwd(), config.updatefolder);
    
    updates = fs.readdirSync(updatefolder);
    updates = updates.sort();

    initConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
        multipleStatements: true
    });
};

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
    var scriptname = updates.find( name => new RegExp(`^update0{0,3}${updatescriptid}\\w*\\.sql$`, 'g').test(name))
    console.log(`spiele Script ${updatescriptid} (${scriptname}) ein...`);
};

var getUpdatescriptNumber = function(scriptname) {
    var result = (/^update(\d{4})\w+\.sql$/g).exec(scriptname);
    if (result.length == 0 || isNaN(parseInt(result[1])) ) return -1;
    else return result[1];
};

/*******************************************************************************
 Module Exports
 ******************************************************************************/

var update = function() {

    connection.connect();

    connection.query(scripts.create_t_updatescripts, function (error, results, fields) {
        if (error) throw error;
        var akt_updateid = results[1][0].updatescriptid;

        var last_updatescriptid = 0;
        var updatescriptid;
        // iteriert durch die vorhanden Updatescripte
        // nimmt vergangene Scripte aus der Betrachtung
        // findet doppelte Scripte -> Fehler
        for (var i = updates.length - 1; i >= 0; i--) {
            updatescriptid = getUpdatescriptNumber(updates[i]);

            if (updatescriptid == -1) {
                console.log();
            }

            if (updatescriptid <= akt_updateid)
                updates.splice(i, 1);
            
        }


        if(akt_updateid === updates.length) {
            console.log("Alle Updates eingespielt!");
        } else if(akt_updateid < updates.length) {
            execUpdate(akt_updateid + 1);
        }
    });

    connection.end();
};


module.exports = function(param){
    initModule(param);

    return {
        update
    };

};