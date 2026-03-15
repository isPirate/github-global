-- AlterTable
ALTER TABLE `translation_configs` ADD COLUMN `scope_mode` VARCHAR(191) NOT NULL DEFAULT 'preset_common_docs',
    ADD COLUMN `selected_files` JSON NULL;
