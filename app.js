const express = require('express'); // Web Framework
const app = express();
const sqlite = require('sqlite');
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

// Express Middleware to verify every request contains a valid 
// macAddress and sessionKey combination
const authorizedDevice = async (req, res, next) => {
  const macAddress = req.body.macAddress || req.query.macAddress;
  const sessionKey = req.body.sessionKey || req.query.sessionKey;

  const query = 'SELECT mac_address FROM authorized_device WHERE mac_address = ? and session_key = ?';
  const params = [macAddress, sessionKey];
  //debug(query, params);

  const results = await db.get(query, params);

  if (results && results.mac_address === macAddress) {
    debug(`${macAddress} is authorized`);
    next();
  } else {
    debug(`${macAddress} is denied. Invalid sessionKey.`);
    res.status(401).send('unauthorized\n');
  }
  
}

app.use(logger('dev'));                                    // log to console
app.use(logger('combined', { stream: accessLogStream }));  // log to file
app.use(cors());                                           // enable cross-origin resource sharing 
app.use(bodyParser.json()); 						                   // for  application/json
app.use(bodyParser.urlencoded({extended: false}));         // for application/x-www-form-urlencoded
app.use(authorizedDevice);                                 // check macAddress and sessionKey

let db;

const server = app.listen(process.env.PORT || 8081, async () => {
    const host = server.address().address;
    const port = server.address().port;
    db = await sqlite.open('./app.sqlite', { cached: true });
    debug('app listening at http://%s:%s', host, port)
});

// Add data point to databases
app.post('/data', async (req, res) => {
  const macAddress = req.body.macAddress;
  const data = req.body.data;
  if (!data) {
    res.status(400).send(`Bad request, data can not be null\n`);
    return;
  }
  
  const insert = 'INSERT INTO readings (mac_address, data_point) VALUES (?,?)';
  const params = [macAddress, data];
  debug(insert, params);

  const results = await db.run(insert, params);
  
  res.location(`/data/${results.lastID}`);
  res.status(201).send(`Created ${results.lastID}\n`);
  
});

// Get all the data submitted for a MAC address
app.get('/data', async (req, res) => {
  const macAddress = req.body.macAddress || req.query.macAddress;
  const query = 'SELECT id as transactionID, mac_address as macAddress, data_point as data, recorded_at as timestamp FROM readings WHERE mac_address=?';
  const params = [macAddress];
  debug(query, params);

  const records = await db.all(query, params);
  res.send(records);

});

// Get one record by id and MAC address
app.get('/data/:transactionID', async(req, res)  => {
  const transactionID = req.params.transactionID;
  const macAddress = req.body.macAddress;
  const query = 'SELECT id as transactionID, mac_address as macAddress, data_point as data, recorded_at as timestamp FROM readings WHERE id=? AND mac_address=?';
  const params = [transactionID, macAddress];
  debug(query, params);

  const record = await db.get(query, params);

  if (record) {
    res.send(record);
  } else {
    res.status(404).send(`Id ${transactionID} not found for ${macAddress}\n`);
  }

});

// Delete one record by id and MAC address
app.delete('/data/:transactionID', async (req, res) => {
  const transactionID = req.params.transactionID;
  const macAddress = req.body.macAddress;

  const query = 'DELETE FROM readings WHERE mac_address = ? AND id = ?';
  const params = [macAddress, transactionID];
  debug(query, params);

  const results = await db.run(query, params);

  if (results.changes > 0) {
    res.status(200).send('OK\n');
  } else {
    res.status(404).send(`Id ${transactionID} not found\n`);
  }

});

app.get('/', function(req,res) {
  res.send('hello');
});
