create database conn_dev;
use conn_dev;

-- TODO table name should be singular
CREATE TABLE readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mac_address VARCHAR(50) NOT NULL,
    device_data TEXT,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- use older password format for compatibilty with older clients
CREATE USER 'node'@'%' IDENTIFIED WITH mysql_native_password BY 'secret';
GRANT ALL PRIVILEGES ON conn_dev.* TO 'node'@'%' WITH GRANT OPTION;
flush privileges;


