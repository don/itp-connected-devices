# Connected Devices Server

Requires MySQL and NodeJS. For local development install NodeJS from [nodejs.org](https://nodejs.org). Install MySQL using [Homebrew](https://brew.sh).

    $ brew install mysql

Start the MySQL server with

    $ mysql.server start

If you'd like the server to run in the background and restart at login

    $ brew services start mysql

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

## Running in production

If you're going to run this on a real server, you'll need HTTPS.

First thing, make sure MySQL is locked down for production. At a minimum run `sudo mysql_secure_installation`. See [Digital Ocean's MySQL installation documentation](https://www.digitalocean.com/community/tutorials/how-to-install-mysql-on-ubuntu-18-04) for more details.

I use [UFW](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-18-04) to only allow access to MySQL from my IP address.

    ufw allow from 93.184.216.34 to any port 3306

The nginx webserver can redirect some requests to the nodejs app. This lets nginx handle TLS and keep the node app simpler. Follow [these instructions](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-18-04) to get nginx running with a TLS certificate from [Let's Encrypt](https://letsencrypt.org/).

Once nginx is running it needs to be configure to send any URLs that start with `/data` to the application. Add a rule to the SSL configuration section of `/etc/nginx/sites-available/default`.

    location /data {
        proxy_pass http://localhost:8081;
    }

Restart nginx.

    service nginx restart

[PM2](http://pm2.keymetrics.io) can keep your nodejs process running as a deamon on the server. Install pm2 with npm.

    npm install -g pm2

Change to the project directory. Install the npm modules. Source the environment and start the app with pm2.

    cd itp-connected-device
    npm install
    source .env
    pm2 start ./app.js

Tell PM2 to restart processes when the server restarts and save your configuration.

    pm2 startup
    pm2 save

Try other commands like `pm2 list` and `pm2 log`.

    root@conndev:~# pm2 list
    ┌──────────┬────┬─────────┬──────┬──────┬────────┬─────────┬────────┬──────┬───────────┬──────┬──────────┐
    │ App name │ id │ version │ mode │ pid  │ status │ restart │ uptime │ cpu  │ mem       │ user │ watching │
    ├──────────┼────┼─────────┼──────┼──────┼────────┼─────────┼────────┼──────┼───────────┼──────┼──────────┤
    │ app      │ 0  │ 1.2.0   │ fork │ 1253 │ online │ 0       │ 114m   │ 0.2% │ 57.6 MB   │ root │ disabled │
    └──────────┴────┴─────────┴──────┴──────┴────────┴─────────┴────────┴──────┴───────────┴──────┴──────────┘
    Use `pm2 show <id|name>` to get more details about an app
    root@conndev:~# 

