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

Once nginx is running it needs to be configure to redirect traffic from nginx to the express app. The simplest way to do this is with proxy pass. This rule sends `/conndev/` to node, so the urls now have a prefix e.g. `/conndev/data`

    location /conndev/ {
        proxy_pass http://localhost:8081/;
    }

A better solution is to redirect `/data` and rewrite the URL so it doesn't look like `/data/data`. This solution keeps the URLs the same between development and production. Edit `/etc/nginx/sites-available/default` and add the follow code

    location  /data {
        rewrite /data/(.*) /$1  break;
        proxy_pass         http://localhost:8081;
        proxy_redirect     off;
        proxy_set_header   Host $host;
    }

