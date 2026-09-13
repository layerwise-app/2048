DROP INDEX IF EXISTS `game_scores_user_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `game_scores_user_id_created_at_unique` ON `game_scores` (`user_id`,`created_at`);