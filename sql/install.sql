-- corex-admin · database tables
--
-- All three tables are auto-created on first boot (see server/bans.lua,
-- server/reports.lua, server/actions_log.lua). This file exists for owners
-- who prefer to provision the schema manually before starting the resource.

-- ----- Bans --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `corex_bans` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `identifier`    VARCHAR(60)  NOT NULL,
    `player_name`   VARCHAR(64)  NOT NULL,
    `reason`        TEXT         NOT NULL,
    `duration`      VARCHAR(16)  NOT NULL DEFAULT 'perma',
    `banned_by`     VARCHAR(64)  NOT NULL,
    `banned_by_id`  VARCHAR(60)  NULL,
    `banned_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at`    TIMESTAMP    NULL,
    `status`        ENUM('active','expired','lifted') NOT NULL DEFAULT 'active',
    `lifted_at`     TIMESTAMP    NULL,
    `lifted_by`     VARCHAR(64)  NULL,
    PRIMARY KEY (`id`),
    KEY `idx_identifier` (`identifier`),
    KEY `idx_status`     (`status`),
    KEY `idx_expires`    (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Reports -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `corex_reports` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reporter_id`   VARCHAR(60)  NOT NULL,
    `reporter_name` VARCHAR(64)  NOT NULL,
    `target_name`   VARCHAR(64)  NOT NULL DEFAULT '',
    `target_id`     VARCHAR(60)  NOT NULL DEFAULT '?',
    `category`      VARCHAR(32)  NOT NULL,
    `description`   TEXT         NOT NULL,
    `status`        ENUM('open','in_progress','resolved','dismissed') NOT NULL DEFAULT 'open',
    `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `resolved_at`   TIMESTAMP    NULL,
    `resolved_by`   VARCHAR(64)  NULL,
    PRIMARY KEY (`id`),
    KEY `idx_status`  (`status`),
    KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Admin action log --------------------------------------------------
CREATE TABLE IF NOT EXISTS `corex_admin_actions` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `actor_id`     VARCHAR(60)  NOT NULL DEFAULT '',
    `actor_name`   VARCHAR(64)  NOT NULL DEFAULT '',
    `actor_src`    INT          NULL,
    `action`       VARCHAR(32)  NOT NULL,
    `target_src`   INT          NULL,
    `target_name`  VARCHAR(64)  NULL,
    `target_id`    VARCHAR(60)  NULL,
    `detail`       VARCHAR(255) NULL,
    PRIMARY KEY (`id`),
    KEY `idx_created` (`created_at`),
    KEY `idx_action`  (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
