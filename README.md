This repository should be merged back into https://github.com/MathuraMG/itp-connected-devices

# Connected Devices Server

Requires MySQL and NodeJS. For local development install NodeJS from [nodejs.org](https://nodejs.org). Install MySQL using [Homebrew](https://brew.sh).

    $ brew install mysql

## Database 

Create a database and tables

    $ mysql -uroot < create-schema.sql

Edit `create-user.sql` and set a strong password for the node user. Run the script to create the user.

    $ mysql -uroot < create-user.sql

## Environment

The server gets the connection information from environment variables. For local development, edit `.env` and then source the file.

    $ source .env

## NPM

Install the dependencies with npm.

    $ npm install

## Run

Run the server with node

    $ node app.js

For more verbose logging try

    $ DEBUG=app:* node app.js

## Authentication

All requests must pass the device MAC address and a matching session key. These can be passed as query parameters or encoded as form data.

Form encoded

    curl -X GET -d macAddress=AA:BB:CC:DD:EE:FF -d sessionKey=12345678 http://localhost:8081/data

Query parameters. Note that `&amp;` must be escaped with a backslash when using `curl`.

    curl -X http://localhost:8081/data?macAddress=AA:BB:CC:DD:EE:FF\&sessionKey=12345678

Add authorized devices by inserting new records in the database.
    
    INSERT INTO authorized_device (mac_address, session_key) VALUES ('AA:BB:CC:DD:EE:FF', '12345678');

## API

    POST /data       - create a new record in the database
    GET /data        - read all the records for a MAC address
    GET /data/:id    - read one record
    DELETE /data/:id - delete one record

### Create

A HTTP POST to `/data` will insert new records. If the record is inserted, the caller will receive a status 201 and the transactionID.

    curl -X POST -d macAddress=AA:BB:CC:DD:EE:FF -d sessionKey=12345678 -d data="hello, world" http://localhost:8081/data

    curl -X POST -d macAddress=AA:BB:CC:DD:EE:FF -d sessionKey=12345678 \
         -d data='{"temperature": 70.9,"humidity": 22.5}' \
         http://localhost:8081/data

### Get

#### Read all records

A HTTP GET to `/data` will list records for MAC address

    curl -X GET -d macAddress=AA:BB:CC:DD:EE:FF -d sessionKey=12345678 http://localhost:8081/data

#### Read one record

A HTTP GET to `/data/:id` will get the record by id for the supplied MAC address

    curl -X GET -d macAddress=AA:BB:CC:DD:EE:FF -d sessionKey=12345678 http://localhost:8081/data/1

### Delete

A HTTP DELETE to `/data/:id` will delete the record from the database

    curl -X DELETE -d macAddress=AA:BB:CC:DD:EE:FF -d sessionKey=12345678 http://localhost:8081/data/1
