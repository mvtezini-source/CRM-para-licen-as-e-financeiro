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

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  password VARCHAR(255),
  role_id INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS job_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_key VARCHAR(100),
  status VARCHAR(50),
  message TEXT,
  ran_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- seed default plans
INSERT IGNORE INTO plans (id, name, price, seats) VALUES
('basic','Básico',0,1),
('standard','Profissional',49,5),
('enterprise','Empresarial',199,50);

-- seed roles
INSERT IGNORE INTO roles (id, name, description) VALUES
(1,'Administrador','Acesso total ao sistema'),
(2,'Gerente','Gerencia clientes, licenças e notificações'),
(3,'Usuário Padrão','Acesso básico de visualização');

-- seed admin user (example)
INSERT IGNORE INTO users (id, name, email, role_id) VALUES
('admin','Administrador','admin@admin',2);

-- permissions and role_permissions
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255),
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- seed permissions
INSERT IGNORE INTO permissions (slug, name, description) VALUES
('manage_clients', 'Gerenciar Clientes', 'Criar/Editar/Remover clientes'),
('manage_licenses', 'Gerenciar Licenças', 'Emitir/Editar licenças'),
('view_logs', 'Visualizar Logs', 'Visualizar logs do sistema'),
('manage_notifications', 'Gerenciar Notificações', 'Gerenciar notificações'),
('manage_users', 'Gerenciar Usuários', 'Gerenciar usuários e papéis'),
('manage_jobs', 'Gerenciar Tarefas Agendadas', 'Executar e configurar tarefas agendadas');

-- assign permissions to roles
-- Administrador: tudo
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Gerente: manage_clients, manage_licenses, manage_notifications, manage_users
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE slug IN ('manage_clients','manage_licenses','manage_notifications','manage_users');

-- Usuário Padrão: nenhuma permissão administrativa por padrão

-- Financial tables
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(100) PRIMARY KEY,
  client_id VARCHAR(100) NOT NULL,
  plan_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME,
  notes TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(100) PRIMARY KEY,
  invoice_id VARCHAR(100) NOT NULL,
  payment_method VARCHAR(50),
  payment_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  external_id VARCHAR(255),
  external_url VARCHAR(500),
  qr_code TEXT,
  copy_paste TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(255),
  event_type VARCHAR(100),
  status VARCHAR(50),
  data JSON,
  processed TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
