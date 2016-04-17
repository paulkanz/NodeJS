#!/usr/bin/env node

var strftime = require('strftime');
var sqlite3 = require('/home/pi/NodeRX/node_modules/sqlite3');
var db = new sqlite3.Database(':memory:');
var restify = require('restify');
var restapi = restify.createServer({
    name: 'node-restify-sqlite',
    version: '1.0.0'
});
//
restapi.use(restify.acceptParser(restapi.acceptable));
restapi.use(restify.queryParser());
//
//
restapi.listen(3000, function () {
  console.log('%s listening at %s', restapi.name, restapi.url);
  console.log("Submit GET to http://localhost:3000/api");
  console.log("Submit UPDATE to http://localhost:3000/update?col1=100&col2=11");
});
//
//  create memory db and add some data to it
db.serialize(function() {
    db.run("CREATE TABLE test_table (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, col1 TEXT, col2 INTEGER, ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    //
    var stmt = db.prepare("INSERT INTO test_table (col1, col2) VALUES (?, ?)");
    //
    for (var i = 0; i < 10; i++) {
        stmt.run('Ipsum ' + i, i);
    }
    //
    stmt.finalize();
});
//
//  timestamp function for logging
function TimeStamp() {
    var TS = strftime('%F %T', new Date());
    return TS;
}
//
//
restapi.get('/api/:id', function(req, res) {
    db.get("SELECT id, col1, col2, ts FROM test_table WHERE id = ?", [req.params.id], function(err, row) {
        if (err) {
            console.warn(TimeStamp() + " SQLite Error " + err);
            res.status(500);
            res.json({
                "Record": "SQLite Error"
            });
        } else {
            if (row !== undefined) {
                console.log(TimeStamp() + " SQLite Record " + req.params.id + " Found ");
                res.status(200);
                res.json({
                    "ROWID": row.id,
                    "COL_1": row.col1,
                    "COL_2": row.col2,
                    "TS": row.ts
                });
            } else {
                console.warn(TimeStamp() + " SQLite Record " + req.params.id + " Not Found ");
                res.status(400);
                res.json({
                    "Record": "NotFound"
                });
            }
        }
    });
});
//
//
restapi.get('/update', function(req, res) {
    db.run("INSERT INTO test_table (col1, col2) VALUES (?, ?)", [req.params.col1, req.params.col2], function(err, row) {
        if (err) {
            console.err(err);
            res.status(500);
        } else {
            console.warn(TimeStamp() + " SQLite Record Added: " + req.params.col1 + " " + req.params.col2);
            res.status(202);
        }
        res.end();
    });
});
//
//
