-- Schema for CRM licensing
CREATE DATABASE IF NOT EXISTS crm_licensing;
USE crm_licensing;

CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  seats INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  plan_id VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS licenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id VARCHAR(100),
  plan_id VARCHAR(100),
  license_key VARCHAR(255) NOT NULL,
  issued_at DATETIME,
  expires_at DATETIME,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_flag TINYINT(1) DEFAULT 0
);

-- seed default plans
INSERT IGNORE INTO plans (id, name, price, seats) VALUES
('basic','Basic',0,1),
('standard','Standard',49,5),
('enterprise','Enterprise',199,50);
