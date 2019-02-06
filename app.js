const express = require('express'); // Web Framework
const app = express();
const mysql = require('mysql');
var cors = require('cors');
var bodyParser = require('body-parser');
var md5 = require('md5');
app.use(cors());

var pool = mysql.createPool({
  connectionLimit : 10,
  host: process.env.CONN_DEV_HOST,
  user: process.env.CONN_DEV_USER,
  password: process.env.CONN_DEV_PASSWORD,
  database: process.env.CONN_DEV_DB
});

let approvedDevices = JSON.parse(process.env.CONN_DEV_LIST);
console.log('approved devices: ' +  JSON.stringify(approvedDevices, null, 2));

app.use(bodyParser.json()); 						           // for  application/json
app.use(bodyParser.urlencoded({extended: false})); // for application/x-www-form-urlencoded

var server = app.listen(process.env.PORT || 8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log('app listening at http://%s:%s', host, port)
});

// devices insert data by posting to add
app.post('/add', function(req,res) {
  // TODO replace with express logging
  console.log(`${new Date()} ${req.connection.remoteAddress} ${req.headers['user-agent']}`);

  let macAddress = req.body.macAddress;
  let sessionKey = req.body.sessionKey;
  let data = JSON.stringify(req.body.data);
  
  const insert = 'INSERT INTO readings (mac_address, device_data) VALUES (?,?)';
  const params = [macAddress, data];

  if (macAddress in approvedDevices && approvedDevices[macAddress] === sessionKey) {
    console.log(insert, params);
    pool.query(insert, params, (error, results, fields) => {
      if (error) {
        console.log(error);
        res.status(500).end();
      } else {
        res.status(201).send({ 'response': '👌', 'id': results.insertId });
      }
    });
  } else {
    console.log(`${macAddress} ${sessionKey} is not in the approved devices list.`);
    res.status(403).send('💩');
  }
});

// allow anyone who knows a mac address to see the data
app.get('/data/:macAddress', function(req,res) {
  let macAddress = req.params.macAddress;
  const query = 'SELECT id, mac_address, device_data, recorded_at FROM readings WHERE mac_address=?';
  const params = [macAddress];
  console.log(query, params);

  pool.query(query, params, (error, results, fields) => {
    // return pretty JSON which is inefficient but much easier to understand
    res.end(JSON.stringify(results, null, 2));
  });
})

// return list of mac addresses that have submitted data
app.get('/mac', function(req,res) {
  const query = 'SELECT distinct(mac_address) FROM readings';
  
  pool.query(query, (error, results, fields) => {
    let macAddresses = results.map(record => record.mac_address);
    res.end(JSON.stringify(macAddresses, null, 2));
  });
})

app.get('/', function(req,res) {
  res.send('hello');
})
