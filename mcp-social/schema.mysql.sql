-- Production-oriented schema for arena-social-mcp

CREATE TABLE IF NOT EXISTS mcp_social_connections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id VARCHAR(191) NOT NULL,
  platform ENUM('linkedin','instagram','telegram') NOT NULL,
  connected TINYINT(1) NOT NULL DEFAULT 0,
  account_id VARCHAR(255) NULL,
  account_label VARCHAR(255) NULL,
  provider VARCHAR(64) NULL,
  scopes JSON NULL,
  secret_blob LONGTEXT NULL,
  meta JSON NULL,
  expires_at DATETIME NULL,
  last_error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_workspace_platform (workspace_id, platform)
);

CREATE TABLE IF NOT EXISTS mcp_social_oauth_states (
  state_id VARCHAR(191) PRIMARY KEY,
  workspace_id VARCHAR(191) NOT NULL,
  platform ENUM('linkedin','instagram') NOT NULL,
  verifier TEXT NULL,
  connection_label VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mcp_social_jobs (
  id VARCHAR(191) PRIMARY KEY,
  workspace_id VARCHAR(191) NOT NULL,
  job_type ENUM('publish','scheduled') NOT NULL,
  status ENUM('scheduled','running','completed','failed','cancelled') NOT NULL,
  payload JSON NOT NULL,
  result JSON NULL,
  run_at DATETIME NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_workspace_status (workspace_id, status),
  KEY idx_run_at (run_at)
);

CREATE TABLE IF NOT EXISTS mcp_social_deliveries (
  id VARCHAR(191) PRIMARY KEY,
  workspace_id VARCHAR(191) NOT NULL,
  source VARCHAR(64) NOT NULL,
  title VARCHAR(512) NULL,
  platforms JSON NOT NULL,
  results JSON NOT NULL,
  errors JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_workspace_created (workspace_id, created_at)
);

CREATE TABLE IF NOT EXISTS mcp_tool_grants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id VARCHAR(191) NOT NULL,
  permission_name VARCHAR(191) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_workspace_permission (workspace_id, permission_name)
);
