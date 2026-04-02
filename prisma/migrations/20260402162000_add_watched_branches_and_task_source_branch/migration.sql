ALTER TABLE `translation_configs`
  ADD COLUMN `watched_branches` JSON NOT NULL DEFAULT (JSON_ARRAY());

ALTER TABLE `translation_tasks`
  ADD COLUMN `source_branch` VARCHAR(191) NULL;
