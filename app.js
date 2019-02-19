const express = require('express'); // Web Framework
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

// logging
const fs = require('fs');
const logger = require('morgan');
const path = require('path');
// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// start app with `DEBUG=app:* node .` to see logs
const debug = require('debug')('app:server');

// mysql connection pool
const pool = mysql.createPool({
  connectionLimit : 10,
  host: process.env.CONN_DEV_HOST,
  user: process.env.CONN_DEV_USER,
  password: process.env.CONN_DEV_PASSWORD,
  database: process.env.CONN_DEV_DB
});

// Express Middleware to verify every request contains a valid 
// macAddress and sessionKey combination
const authorizedDevice = function(req, res, next) {
  const macAddress = req.body.macAddress || req.query.macAddress;
  const sessionKey = req.body.sessionKey || req.query.sessionKey;

  const query = 'SELECT mac_address FROM authorized_device WHERE mac_address = ? and session_key = ?';
  const params = [macAddress, sessionKey];

  pool.query(query, params, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('server error\n');
    } else {
      if (results.length === 1) {
        debug(`${macAddress} is authorized`);
        next();
      } else {
        debug(`${macAddress} is denied. Invalid sessionKey.`);
        res.status(401).send('unauthorized\n');
      }
    }
  });
}

app.use(logger('dev'));                                    // log to console
app.use(logger('combined', { stream: accessLogStream }));  // log to file
app.use(cors());                                           // enable cross-origin resource sharing 
app.use(bodyParser.json()); 						                   // for  application/json
app.use(bodyParser.urlencoded({extended: false}));         // for application/x-www-form-urlencoded
app.use(authorizedDevice);                                 // check macAddress and sessionKey

const server = app.listen(process.env.PORT || 8081, function () {
    const host = server.address().address;
    const port = server.address().port;
    debug('app listening at http://%s:%s', host, port)
});

// Add data point to databases
app.post('/data', function(req,res) {
  const macAddress = req.body.macAddress;
  const data = req.body.data;
  if (!data) {
    res.status(400).send(`Bad request, data can not be null\n`);
    return;
  }
  
  const insert = 'INSERT INTO Zreadings (mac_address, data_point) VALUES (?,?)';
  const params = [macAddress, data];
  debug(insert, params);

  pool.query(insert, params, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('server error\n');
    } else {
      // location header points to the new resource
      res.location(`/data/${results.insertId}`);
      res.status(201).send(`Created ${results.insertId}\n`);
    }
  });
  
});

// Get all the data submitted for a MAC address
app.get('/data', function(req,res) {
  const macAddress = req.body.macAddress || req.query.macAddress;
  const query = 'SELECT id as transactionID, mac_address as macAddress, data_point as data, recorded_at as timestamp FROM readings WHERE mac_address=?';
  const params = [macAddress];
  debug(query, params);

  pool.query(query, params, (error, results, fields) => {
    // return pretty JSON which is inefficient but much easier to understand
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(results, null, 2));
  });
});

// Get one record by id and MAC address
app.get('/data/:transactionID', function(req,res) {
  const transactionID = req.params.transactionID;
  const macAddress = req.body.macAddress;
  const query = 'SELECT id as transactionID, mac_address as macAddress, data_point as data, recorded_at as timestamp FROM readings WHERE id=? AND mac_address=?';
  const params = [transactionID, macAddress];
  debug(query, params);

  pool.query(query, params, (error, results, fields) => {
    if (results.length > 0) {
      // return pretty JSON which is inefficient but much easier to understand
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(results[0], null, 2));
    } else {
      res.status(404).send(`Id ${transactionID} not found for ${macAddress}\n`);
    }
  });
});

// Delete one record by id and MAC address
app.delete('/data/:transactionID', function(req,res) {
  const transactionID = req.params.transactionID;
  const macAddress = req.body.macAddress;

  const query = 'DELETE FROM readings WHERE mac_address = ? AND id = ?';
  const params = [macAddress, transactionID];
  debug(query, params);

  pool.query(query, params, (error, results, fields) => {
    if (results.affectedRows > 0) {
      res.status(200).send('OK\n');
    } else {
      res.status(404).send(`Id ${transactionID} not found\n`);
    }
  });
});

app.get('/', function(req,res) {
  res.send('hello');
});
