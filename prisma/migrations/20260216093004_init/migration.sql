-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `github_id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `avatar_url` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_github_id_key`(`github_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `github_app_installations` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `installation_id` BIGINT NOT NULL,
    `github_account_id` BIGINT NOT NULL,
    `account_login` VARCHAR(191) NOT NULL,
    `account_type` VARCHAR(191) NOT NULL,
    `permissions` JSON NOT NULL,
    `repository_selection` VARCHAR(191) NOT NULL,
    `access_token` TEXT NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `github_app_installations_user_id_idx`(`user_id`),
    INDEX `github_app_installations_installation_id_idx`(`installation_id`),
    UNIQUE INDEX `github_app_installations_installation_id_key`(`installation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repositories` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `installation_id` VARCHAR(191) NOT NULL,
    `github_repo_id` BIGINT NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `language` VARCHAR(191) NULL,
    `stargazers_count` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `webhook_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `repositories_github_repo_id_key`(`github_repo_id`),
    INDEX `repositories_user_id_idx`(`user_id`),
    INDEX `repositories_github_repo_id_idx`(`github_repo_id`),
    INDEX `repositories_installation_id_idx`(`installation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `translation_configs` (
    `id` VARCHAR(191) NOT NULL,
    `repository_id` VARCHAR(191) NOT NULL,
    `base_language` VARCHAR(191) NOT NULL DEFAULT 'auto',
    `target_languages` JSON NOT NULL,
    `file_patterns` JSON NOT NULL,
    `exclude_patterns` JSON NULL,
    `target_branch_template` VARCHAR(191) NOT NULL DEFAULT 'i18n/{lang}',
    `commit_message_template` VARCHAR(191) NOT NULL DEFAULT 'docs: translate to {lang}',
    `sync_strategy` VARCHAR(191) NOT NULL DEFAULT 'full',
    `trigger_mode` VARCHAR(191) NOT NULL DEFAULT 'webhook',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `translation_configs_repository_id_key`(`repository_id`),
    INDEX `translation_configs_repository_id_idx`(`repository_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `translation_engines` (
    `id` VARCHAR(191) NOT NULL,
    `repository_id` VARCHAR(191) NOT NULL,
    `engine_type` VARCHAR(191) NOT NULL,
    `encrypted_api_key` TEXT NOT NULL,
    `config` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `translation_engines_repository_id_idx`(`repository_id`),
    INDEX `translation_engines_engine_type_idx`(`engine_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `translation_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `repository_id` VARCHAR(191) NOT NULL,
    `trigger_type` VARCHAR(191) NOT NULL,
    `trigger_commit_sha` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `total_files` INTEGER NOT NULL DEFAULT 0,
    `processed_files` INTEGER NOT NULL DEFAULT 0,
    `failed_files` INTEGER NOT NULL DEFAULT 0,
    `total_tokens` INTEGER NOT NULL DEFAULT 0,
    `estimated_cost` DECIMAL(10, 4) NULL,
    `error_message` TEXT NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `translation_tasks_repository_id_idx`(`repository_id`),
    INDEX `translation_tasks_status_idx`(`status`),
    INDEX `translation_tasks_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `translation_files` (
    `id` VARCHAR(191) NOT NULL,
    `task_id` VARCHAR(191) NOT NULL,
    `repository_id` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `target_language` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `source_content_hash` VARCHAR(191) NULL,
    `translated_content_hash` VARCHAR(191) NULL,
    `tokens_used` INTEGER NOT NULL DEFAULT 0,
    `error_message` TEXT NULL,
    `pr_number` INTEGER NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `translation_files_task_id_idx`(`task_id`),
    INDEX `translation_files_repository_id_idx`(`repository_id`),
    INDEX `translation_files_file_path_idx`(`file_path`),
    INDEX `translation_files_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `translation_history` (
    `id` VARCHAR(191) NOT NULL,
    `task_id` VARCHAR(191) NOT NULL,
    `repository_id` VARCHAR(191) NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `event_data` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `translation_history_task_id_idx`(`task_id`),
    INDEX `translation_history_repository_id_idx`(`repository_id`),
    INDEX `translation_history_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `repository_id` VARCHAR(191) NULL,
    `github_delivery_id` VARCHAR(191) NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `error_message` TEXT NULL,
    `received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,

    UNIQUE INDEX `webhook_events_github_delivery_id_key`(`github_delivery_id`),
    INDEX `webhook_events_repository_id_idx`(`repository_id`),
    INDEX `webhook_events_github_delivery_id_idx`(`github_delivery_id`),
    INDEX `webhook_events_processed_idx`(`processed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `github_app_installations` ADD CONSTRAINT `github_app_installations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_installation_id_fkey` FOREIGN KEY (`installation_id`) REFERENCES `github_app_installations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `translation_configs` ADD CONSTRAINT `translation_configs_repository_id_fkey` FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `translation_engines` ADD CONSTRAINT `translation_engines_repository_id_fkey` FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `translation_tasks` ADD CONSTRAINT `translation_tasks_repository_id_fkey` FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `translation_files` ADD CONSTRAINT `translation_files_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `translation_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `translation_files` ADD CONSTRAINT `translation_files_repository_id_fkey` FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `translation_history` ADD CONSTRAINT `translation_history_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `translation_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `translation_history` ADD CONSTRAINT `translation_history_repository_id_fkey` FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
