#!/usr/bin/env node
 //
//
var PORT = your_mqtts_port;
var HOST = 'your_host.cloudmqtt.com';
var USER = 'your_user';
var PASSWD = 'your_password';
//
//
var mqtt = require('mqtt');
var strftime = require('strftime');
var sqlite3 = require('sqlite3');
var fs = require('fs');
var uuid = require('node-uuid');
//
var db = new sqlite3.Database(':memory:');
var UUID = uuid.v4();
//
var KEY = fs.readFileSync('yourhost.key');
var CERT = fs.readFileSync('yourhost.cert');
var TRUSTED_CA_LIST = fs.readFileSync('ca-certificates.crt');
//
var options = {
    port: PORT,
    host: HOST,
    ca: TRUSTED_CA_LIST,
    keyPath: KEY,
    certPath: CERT,
    username: USER,
    password: PASSWD,
    rejectUnauthorized: false,
    protocol: 'mqtts'
};
//
var client = mqtt.connect(options);
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
    db.all("SELECT id, col1, col2, ts FROM test_table", function(err, row) {
        //
        if (err) {
            var TimeStamp = strftime('%F %T', new Date());
            console.warn(TimeStamp + " Sqlite Error " + err);
        }
        //
        client.on('error', function(err) {
            var TimeStamp = strftime('%F %T', new Date());
            console.warn(TimeStamp + " MQTT Connection Issue: " + err);
            client.end();
        });
        //
        client.on('connect', function() {
            //
            row.forEach(function(obj) {
                //
                var itemdata = {
                    COL_2: obj.col2,
                    TS: obj.ts
                };
                //
                for (var index in itemdata) {
                    //
                    var topic = (UUID + '/' + obj.id + '/' + index).toString();
                    var msg = itemdata[index].toString();
                    //
                    client.publish(topic, msg, {
                        qos: 0,
                        retain: true
                    }, function(errpub) {
                        if (errpub) {
                            var TimeStamp = strftime('%F %T', new Date());
                            console.warn(TimeStamp + " MQTT Publish Error: " + errpub);
                        }
                    });
                    //
                    var TimeStamp = strftime('%F %T', new Date());
                    console.log(TimeStamp + " MQTT Publish: " + topic + '/' + msg);
                }
                //
                console.log(Array(11).join("-"));
            }); // row.forEach
            //
            client.end();
        }); // client.in
    }); // db.all
}); // db.serialize
//
//
