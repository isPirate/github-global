ALTER TABLE `github_app_installations`
  DROP COLUMN `access_token`,
  DROP COLUMN `expires_at`;

ALTER TABLE `translation_configs`
  DROP COLUMN `target_branch_template`,
  DROP COLUMN `commit_message_template`,
  DROP COLUMN `sync_strategy`;

ALTER TABLE `translation_tasks`
  DROP COLUMN `estimated_cost`;
