ALTER TABLE `users`
  ADD COLUMN `github_user_access_token` TEXT NULL,
  ADD COLUMN `github_user_access_token_expires_at` DATETIME(3) NULL,
  ADD COLUMN `github_user_refresh_token` TEXT NULL,
  ADD COLUMN `github_user_refresh_token_expires_at` DATETIME(3) NULL,
  ADD COLUMN `github_user_token_scope` TEXT NULL;
