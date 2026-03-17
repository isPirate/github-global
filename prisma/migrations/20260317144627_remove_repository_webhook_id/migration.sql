/*
  Warnings:

  - You are about to drop the column `webhook_id` on the `repositories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `repositories` DROP COLUMN `webhook_id`;
