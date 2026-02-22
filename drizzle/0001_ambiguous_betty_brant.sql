CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('bypass_attempt','new_ban','suspicious_activity','info') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executor_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int,
	`scriptId` int,
	`hwid` varchar(256),
	`scriptName` varchar(255),
	`executorName` varchar(128),
	`gameId` varchar(64),
	`gameName` varchar(255),
	`ipAddress` varchar(64),
	`status` enum('success','error','blocked','bypass_attempt') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `executor_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hwid_bans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hwid` varchar(256) NOT NULL,
	`userId` int,
	`reason` text,
	`bannedBy` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hwid_bans_id` PRIMARY KEY(`id`),
	CONSTRAINT `hwid_bans_hwid_unique` UNIQUE(`hwid`)
);
--> statement-breakpoint
CREATE TABLE `remote_loaders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`accessKey` varchar(64) NOT NULL,
	`scriptId` int,
	`scriptKey` text,
	`scriptUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`requireHwid` boolean NOT NULL DEFAULT false,
	`executionCount` int NOT NULL DEFAULT 0,
	`lastExecutedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `remote_loaders_id` PRIMARY KEY(`id`),
	CONSTRAINT `remote_loaders_accessKey_unique` UNIQUE(`accessKey`)
);
--> statement-breakpoint
CREATE TABLE `scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`originalKey` text,
	`originalUrl` text,
	`obfuscatedKey` text,
	`obfuscatedUrl` text,
	`fileType` enum('lua','txt') NOT NULL DEFAULT 'lua',
	`executionCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`obfuscationOptions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`obfStringLayers` int NOT NULL DEFAULT 3,
	`obfConstantArray` boolean NOT NULL DEFAULT true,
	`obfAntiTamper` boolean NOT NULL DEFAULT true,
	`obfEnvChecks` boolean NOT NULL DEFAULT true,
	`obfVariableRename` boolean NOT NULL DEFAULT true,
	`obfControlFlow` boolean NOT NULL DEFAULT true,
	`obfDeadCode` boolean NOT NULL DEFAULT false,
	`notifyBypassAttempt` boolean NOT NULL DEFAULT true,
	`notifyNewBan` boolean NOT NULL DEFAULT true,
	`notifySuspiciousActivity` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `hwid` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `banReason` text;