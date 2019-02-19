create database conn_dev;
use conn_dev;

-- readings holds data points from devices
CREATE TABLE readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mac_address CHAR(17) NOT NULL,
    data_point TEXT,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- authorized device holds the valid MAC address and session key combinations
-- which act like a username and password
CREATE TABLE authorized_device (
    mac_address CHAR(17) NOT NULL PRIMARY KEY,
    session_key TEXT
);

-- add dummy device to authorized_devices 
INSERT INTO authorized_device (mac_address, session_key) VALUES ('AA:BB:CC:DD:EE:FF', '12345678');
