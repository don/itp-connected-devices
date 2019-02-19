-- With MySQL 8, use older password format for compatibilty with older clients
-- For MySQL 5.7 remove "WITH mysql_native_password"
CREATE USER 'node'@'localhost' IDENTIFIED WITH mysql_native_password BY 'secret';
GRANT ALL PRIVILEGES ON conn_dev.* TO 'node'@'localhost' WITH GRANT OPTION;
flush privileges;
