#!/usr/bin/env node
//
//
var dweetClient = require('node-dweetio');
var dweetio = new dweetClient();
var strftime = require('strftime');
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database(':memory:');
var uuid = require('node-uuid');
//
var UUID = uuid.v4();
//
//
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
//
//
db.serialize(function() {
    //
    db.run("CREATE TABLE test_table (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, col1 TEXT, col2 INTEGER, ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    //
    var stmt = db.prepare("INSERT INTO test_table (col1, col2) VALUES (?, ?)");
    //
    for (var i = 0; i < 2; i++) {
        stmt.run('Ipsum ' + i, i);
    }
    //
    stmt.finalize();
    //
    console.log("|_____________UUID__________________-Row______|_______________________________Content of dweet_________________________|___________TimeStamp_of_POST_of_Dweet__|");
    //
    db.all("SELECT id, col1, col2, ts FROM test_table", function(err, row) {
        //
        if (err) {
            var TimeStamp = strftime('%F %T', new Date());
            console.warn(TimeStamp + " Sqlite Error " + err);
        }
        //
        //
        row.forEach(function(obj) {
            //
            var ThingData = {
                ROWID: obj.id,
                COL_1: obj.col1,
                COL_2: obj.col2,
                TS: obj.ts
            };
            //
            var Thing = UUID + "-" + pad(obj.col2, 3);
            //
            dweetio.dweet_for(Thing, ThingData, function(err, dweet) {
                if (err) {
                   var TimeStamp = strftime('%F %T', new Date());
                   console.warn(TimeStamp + " dweet Error: " + err);
                }
                // console.log(dweet.thing); // "my-thing"
                // console.log(dweet.content); // The content of the dweet
                // console.log(dweet.created); // The create date of the dweet
                console.log(dweet.thing + "\t" + JSON.stringify(dweet.content) + "\t" + dweet.created);
            });
            //
        }); // row.forEach
        //
    }); // db.all
}); // db.serialize
