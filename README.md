This repository should be merged back into https://github.com/MathuraMG/itp-connected-devices

# Connected Devices Server

Requires MySQL and NodeJS. For local development install NodeJS from [nodejs.org](https://nodejs.org). Install MySQL using [Homebrew](https://brew.sh).

    $ brew install mysql

## Database 

Create a database, schema, and user

    $ mysql -uroot < schema.ddl 

## Environment

The server gets the connection and device information from environment variables. For local development, edit `.env` and then source the file.

    $ source .env

## NPM

Install the dependencies with npm.

    $ npm install

## Run

Run the server with node

    $ node app.js

## Testing

### Insert

    curl -d macAddress=AA:BB:CC:DD:EE:FF -d sessionKey=12345678 -d sensor_data=123 http://localhost:8081/add

    curl -d macAddress=AA:BB:CC:DD:EE:FF -d sessionKey=12345678 \
         -d sensor_data='"temperature":"70.9","humidity":"22.5"}' \
         http://localhost:8081/add

### Query

Get a list of all MAC address that have submitted data

    curl http://localhost:8081/mac

See the data for any MAC address

    curl http://localhost:8081/data/AA:BB:CC:DD:EE:FF



