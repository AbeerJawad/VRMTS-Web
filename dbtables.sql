-- VRMTS schema: import order matches mysqldump (child tables before parents).
-- Without this, CREATE TABLE admin fails with ERROR 1824 (references user before user exists).
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;

-- Idempotent restore: drop tables left over from a partial import (ERROR 1050).
DROP TABLE IF EXISTS
  `ai_question_staging`,
  `admin`,
  `aichat`,
  `aifeedback`,
  `analyticsdata`,
  `anatomymodel`,
  `anatomysystem`,
  `answerrecord`,
  `audit_logs`,
  `learningsession`,
  `modelinteraction`,
  `module`,
  `modulecontent`,
  `notification`,
  `questionbank`,
  `quiz`,
  `quizattempt`,
  `quizquestion`,
  `reportrequest`,
  `sessionanalytics`,
  `sessions`,
  `student`,
  `studentmoduleassignment`,
  `systemreport`,
  `teacher`,
  `user`,
  `useraccessibility`,
  `usernotifications`,
  `userpreferences`;

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- ------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `adminId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  PRIMARY KEY (`adminId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` VALUES (1,1),(2,2);

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `logId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entityId` int DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`logId`),
  KEY `idx_userId` (`userId`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `aichat`
--

CREATE TABLE `aichat` (
  `chatId` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `moduleId` int DEFAULT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `response` text COLLATE utf8mb4_unicode_ci,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `context` text COLLATE utf8mb4_unicode_ci,
  `sentiment` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `optResponse` json DEFAULT NULL,
  `rateResponse` decimal(3,2) DEFAULT NULL,
  PRIMARY KEY (`chatId`),
  KEY `moduleId` (`moduleId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `aichat_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `student` (`studentId`) ON DELETE CASCADE,
  CONSTRAINT `aichat_ibfk_2` FOREIGN KEY (`moduleId`) REFERENCES `module` (`moduleId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `aichat`
--

--
-- Table structure for table `aifeedback`
--

CREATE TABLE `aifeedback` (
  `feedbackId` int NOT NULL AUTO_INCREMENT,
  `attemptId` int DEFAULT NULL,
  `studentId` int NOT NULL,
  `feedbackText` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `improvementSuggestions` text COLLATE utf8mb4_unicode_ci,
  `confidenceScore` decimal(5,2) DEFAULT NULL,
  `generatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `generateAttempt` tinyint(1) DEFAULT '1',
  `deliver` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`feedbackId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_attemptId` (`attemptId`),
  CONSTRAINT `aifeedback_ibfk_1` FOREIGN KEY (`attemptId`) REFERENCES `quizattempt` (`attemptId`) ON DELETE SET NULL,
  CONSTRAINT `aifeedback_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `student` (`studentId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `aifeedback`
--

INSERT INTO `aifeedback` VALUES (1,NULL,1,'You scored 20% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2025-12-10 03:27:34',1,1),(2,NULL,1,'You scored 50% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2025-12-10 03:46:54',1,1),(3,NULL,1,'You scored 30% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2025-12-10 10:31:11',1,1),(4,NULL,1,'You scored 40% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2025-12-10 14:46:18',1,1),(5,NULL,1,'You scored 30% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-01-15 04:18:33',1,1),(6,NULL,1,'You scored 10% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-17 03:27:17',1,1),(7,NULL,1,'You scored 58% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-17 03:57:30',1,1),(8,NULL,1,'You scored 73% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-02-17 04:30:15',1,1),(9,NULL,1,'You scored 5% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-17 04:37:03',1,1),(10,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:02:24',1,1),(11,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:02:24',1,1),(12,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:02:53',1,1),(13,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:02:53',1,1),(14,NULL,1,'You scored 18% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:03:50',1,1),(15,NULL,1,'You scored 12% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:13:55',1,1),(16,NULL,1,'You scored 12% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:33:46',1,1),(17,NULL,1,'You scored 9% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:34:33',1,1),(18,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:41:49',1,1),(19,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:41:49',1,1),(20,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:41:59',1,1),(21,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:41:59',1,1),(22,68,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:53:42',1,1),(23,67,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:54:09',1,1),(24,70,1,'You scored 50% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:56:22',1,1),(25,69,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 01:02:26',1,1),(27,72,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 09:49:34',1,1),(28,73,1,'You scored 100% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-03-01 15:02:04',1,1),(29,74,1,'You scored 67% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-03-01 15:13:12',1,1),(30,75,1,'You scored 100% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-03-01 15:18:24',1,1),(31,76,1,'You scored 100% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-03-01 15:25:52',1,1);

--
-- Table structure for table `analyticsdata`
--

CREATE TABLE `analyticsdata` (
  `dataId` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `date` date NOT NULL,
  `studyTimeMinutes` int DEFAULT '0',
  `quizzesAttempted` int DEFAULT '0',
  `modelsViewed` int DEFAULT '0',
  `averageScore` decimal(5,2) DEFAULT NULL,
  `generateDashboard` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`dataId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_date` (`date`),
  CONSTRAINT `analyticsdata_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `student` (`studentId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `analyticsdata`
--

INSERT INTO `analyticsdata` VALUES (1,1,'2025-12-02',90,1,5,92.00,1),(2,1,'2025-12-03',75,0,4,NULL,1),(3,1,'2025-12-08',60,0,3,NULL,1),(4,2,'2025-12-04',80,1,6,85.00,1),(5,2,'2025-12-08',60,0,4,NULL,1),(6,3,'2025-12-06',70,0,3,NULL,1),(7,1,'2025-12-02',90,1,5,92.00,1),(8,1,'2025-12-03',75,0,4,NULL,1),(9,1,'2025-12-08',60,0,3,NULL,1),(10,2,'2025-12-04',80,1,6,85.00,1),(11,2,'2025-12-08',60,0,4,NULL,1),(12,3,'2025-12-06',70,0,3,NULL,1);

--
-- Table structure for table `anatomymodel`
--

CREATE TABLE `anatomymodel` (
  `modelId` int NOT NULL AUTO_INCREMENT,
  `systemId` int DEFAULT NULL,
  `modelName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbnailPath` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `render3D` tinyint(1) DEFAULT '1',
  `oeDealer` tinyint(1) DEFAULT '0',
  `interactionType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modelId`),
  KEY `idx_systemId` (`systemId`),
  KEY `idx_modelName` (`modelName`),
  CONSTRAINT `anatomymodel_ibfk_1` FOREIGN KEY (`systemId`) REFERENCES `anatomysystem` (`systemId`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `anatomymodel`
--

INSERT INTO `anatomymodel` VALUES (1,2,'Full Skeleton','1.0','/dummy/thumb/skeleton.jpg','/dummy/models/skeleton.glb',NULL,NULL,1,0,NULL),(2,7,'Heart Anatomy','1.0','/dummy/thumb/heart.jpg','/dummy/models/heart.glb',NULL,NULL,1,0,NULL),(3,6,'Lungs Model','1.0','/dummy/thumb/lungs.jpg','/dummy/models/lungs.glb',NULL,NULL,1,0,NULL),(4,4,'Brain Model','1.0','/dummy/thumb/brain.jpg','/dummy/models/brain.glb',NULL,NULL,1,0,NULL),(5,11,'Muscle System','1.0','/dummy/thumb/muscles.jpg','/dummy/models/muscles.glb',NULL,NULL,1,0,NULL);

--
-- Table structure for table `anatomysystem`
--

CREATE TABLE `anatomysystem` (
  `systemId` int NOT NULL AUTO_INCREMENT,
  `systemName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`systemId`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `anatomysystem`
--

INSERT INTO `anatomysystem` VALUES (1,'Anatomical Terminology','Foundation concepts, planes, and directional terms','Foundation'),(2,'Skeletal System','Bones, joints, and skeletal structure','Musculoskeletal'),(3,'Nervous System - Spinal','Spinal cord, spinal nerves, and reflexes','Neurological'),(4,'Nervous System - Brain','Brain structures and cranial nerves','Neurological'),(5,'Special Senses','Vision, hearing, taste, smell, and equilibrium','Sensory'),(6,'Respiratory System','Airways, lungs, and gas exchange','Respiratory'),(7,'Cardiovascular System','Heart, blood vessels, and circulation','Circulatory'),(8,'Digestive System','Alimentary canal and digestive organs','Digestive'),(9,'Urinary System','Kidneys and urinary tract','Excretory'),(10,'Reproductive System','Male and female reproductive organs','Reproductive'),(11,'Muscular System','Skeletal muscles and muscle groups','Musculoskeletal');

--
-- Table structure for table `answerrecord`
--

CREATE TABLE `answerrecord` (
  `recordId` int NOT NULL AUTO_INCREMENT,
  `attemptId` int NOT NULL,
  `questionId` int NOT NULL,
  `studentAnswer` text COLLATE utf8mb4_unicode_ci,
  `isCorrect` tinyint(1) DEFAULT NULL,
  `pointsEarned` decimal(4,2) DEFAULT '0.00',
  `timeSpent` int DEFAULT NULL,
  `recordAnswer` tinyint(1) DEFAULT '1',
  `validate` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`recordId`),
  UNIQUE KEY `idx_attemptId_questionId` (`attemptId`,`questionId`),
  KEY `idx_attemptId` (`attemptId`),
  KEY `idx_questionId` (`questionId`),
  CONSTRAINT `answerrecord_ibfk_1` FOREIGN KEY (`attemptId`) REFERENCES `quizattempt` (`attemptId`) ON DELETE CASCADE,
  CONSTRAINT `answerrecord_ibfk_2` FOREIGN KEY (`questionId`) REFERENCES `quizquestion` (`questionId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=229 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `answerrecord`
--

INSERT INTO `answerrecord` VALUES (203,68,497,'Toward the feet',0,0.00,0,1,1),(204,68,498,'Divides body diagonally',0,0.00,0,1,1),(205,68,496,'Toward the front',0,0.00,0,1,1),(206,68,495,'Divides body diagonally',0,0.00,0,1,1),(207,67,497,'Toward the feet',0,0.00,0,1,1),(208,67,496,'Toward the back',0,0.00,0,1,1),(209,67,495,'Updated',0,0.00,0,1,1),(210,67,498,'Divides body into top and bottom',0,0.00,0,1,1),(211,70,502,'Toward the front',0,0.00,0,1,1),(212,70,500,'Away from the point of attachment',1,1.00,0,1,1),(213,69,499,'Toward the midline',0,0.00,0,1,1),(214,69,501,'Toward the front',0,0.00,0,1,1),(217,72,506,'1',0,0.00,0,1,1),(218,73,505,'2',1,1.00,0,1,1),(221,74,506,'2',1,1.00,0,1,1),(225,75,506,'2',1,1.00,0,1,1),(228,76,506,'2',1,1.00,0,1,1);

--
-- Table structure for table `learningsession`
--

CREATE TABLE `learningsession` (
  `sessionId` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `moduleId` int DEFAULT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime DEFAULT NULL,
  `sessionType` enum('study','quiz','practice','review') COLLATE utf8mb4_unicode_ci DEFAULT 'study',
  `duration` int DEFAULT NULL,
  `recordActivity` tinyint(1) DEFAULT '1',
  `generateAnalytics` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`sessionId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_moduleId` (`moduleId`),
  KEY `idx_startTime` (`startTime`),
  CONSTRAINT `learningsession_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `student` (`studentId`) ON DELETE CASCADE,
  CONSTRAINT `learningsession_ibfk_2` FOREIGN KEY (`moduleId`) REFERENCES `module` (`moduleId`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `learningsession`
--

INSERT INTO `learningsession` VALUES (1,1,2,'2025-12-09 16:44:07','2025-12-09 17:44:07','study',60,1,1),(2,2,2,'2025-12-09 15:44:07','2025-12-09 16:44:07','study',60,1,1),(3,3,2,'2025-12-09 13:44:07','2025-12-09 14:44:07','practice',60,1,1),(4,4,2,'2025-12-08 18:44:07','2025-12-08 19:29:07','study',45,1,1),(5,5,2,'2025-12-09 14:44:07','2025-12-09 15:44:07','study',60,1,1);

--
-- Table structure for table `modelinteraction`
--

CREATE TABLE `modelinteraction` (
  `interactionId` int NOT NULL AUTO_INCREMENT,
  `sessionId` int DEFAULT NULL,
  `modelId` int DEFAULT NULL,
  `interactionType` enum('view','rotate','zoom','annotate','dissect') COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `durationSeconds` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `record` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`interactionId`),
  KEY `idx_sessionId` (`sessionId`),
  KEY `idx_modelId` (`modelId`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `modelinteraction_ibfk_1` FOREIGN KEY (`sessionId`) REFERENCES `learningsession` (`sessionId`) ON DELETE CASCADE,
  CONSTRAINT `modelinteraction_ibfk_2` FOREIGN KEY (`modelId`) REFERENCES `anatomymodel` (`modelId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `modelinteraction`
--

--
-- Table structure for table `module`
--

CREATE TABLE `module` (
  `moduleId` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `difficultyLevel` enum('beginner','intermediate','advanced') COLLATE utf8mb4_unicode_ci DEFAULT 'beginner',
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`moduleId`),
  KEY `idx_difficultyLevel` (`difficultyLevel`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `module`
--

INSERT INTO `module` VALUES (1,'LAB 1: Anatomical Language','beginner','Introduction to anatomical terminology, body planes, directional terms, and anatomical position','2025-12-09 18:39:40'),(2,'LAB 2: Bones and Bone Markings','beginner','Study of skeletal structure, bone classifications, and anatomical landmarks','2025-12-09 18:39:40');

--
-- Table structure for table `modulecontent`
--

CREATE TABLE `modulecontent` (
  `contentId` int NOT NULL AUTO_INCREMENT,
  `moduleId` int NOT NULL,
  `modelId` int DEFAULT NULL,
  `contentType` enum('video','text','interactive','3d_model','quiz') COLLATE utf8mb4_unicode_ci NOT NULL,
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayOrder` int DEFAULT '0',
  `durationMinutes` int DEFAULT NULL,
  `trackProgress` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`contentId`),
  KEY `modelId` (`modelId`),
  KEY `idx_moduleId` (`moduleId`),
  KEY `idx_contentType` (`contentType`),
  KEY `idx_displayOrder` (`displayOrder`),
  CONSTRAINT `modulecontent_ibfk_1` FOREIGN KEY (`moduleId`) REFERENCES `module` (`moduleId`) ON DELETE CASCADE,
  CONSTRAINT `modulecontent_ibfk_2` FOREIGN KEY (`modelId`) REFERENCES `anatomymodel` (`modelId`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `modulecontent`
--

INSERT INTO `modulecontent` VALUES (1,1,NULL,'video',NULL,'Introduction to Anatomical Terminology',1,12,1),(2,1,NULL,'interactive',NULL,'Body Planes and Sections',2,15,1),(3,1,NULL,'quiz',NULL,'Anatomical Language Quiz',3,20,1),(4,2,NULL,'video',NULL,'Skeletal System Overview',1,15,1),(5,2,NULL,'3d_model',NULL,'Complete Skeleton Model',2,25,1),(6,2,NULL,'quiz',NULL,'Bones Quiz',3,25,1);

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `notificationId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `isRead` tinyint(1) DEFAULT '0',
  `notificationType` enum('info','warning','success','reminder') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `markAsRead` tinyint(1) DEFAULT '0',
  `delete_` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`notificationId`),
  KEY `idx_userId` (`userId`),
  KEY `idx_isRead` (`isRead`),
  KEY `idx_createdAt` (`createdAt`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` VALUES (1,6,'Great Progress!','You have completed 4 modules!','2025-12-09 18:44:49',0,'success',0,0),(2,7,'Quiz Available','New quiz available for Lab 4','2025-12-09 16:44:49',0,'info',0,0),(3,8,'Keep Going','You are making good progress on Lab 3','2025-12-08 18:44:49',1,'info',0,0),(4,9,'Study Reminder','Continue your learning streak','2025-12-09 15:44:49',0,'reminder',0,0),(5,10,'Welcome!','Welcome to VRMTS Learning Platform','2025-11-24 18:44:49',1,'info',0,0),(6,6,'Great Progress!','You have completed 4 modules!','2025-12-09 18:45:15',0,'success',0,0),(7,7,'Quiz Available','New quiz available for Lab 4','2025-12-09 16:45:15',0,'info',0,0),(8,8,'Keep Going','You are making good progress on Lab 3','2025-12-08 18:45:15',1,'info',0,0),(9,9,'Study Reminder','Continue your learning streak','2025-12-09 15:45:15',0,'reminder',0,0),(10,10,'Welcome!','Welcome to VRMTS Learning Platform','2025-11-24 18:45:15',1,'info',0,0);

--
-- Table structure for table `questionbank`
--

CREATE TABLE `questionbank` (
  `bankId` int NOT NULL AUTO_INCREMENT,
  `questionType` enum('multiple_choice','true_false','short_answer','labeling','drag_drop') COLLATE utf8mb4_unicode_ci NOT NULL,
  `difficulty` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `topic` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `moduleId` int DEFAULT NULL,
  `systemId` int DEFAULT NULL,
  `correctAnswer` text COLLATE utf8mb4_unicode_ci,
  `options` json DEFAULT NULL,
  `explanation` text COLLATE utf8mb4_unicode_ci,
  `questionText` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `getByDifficultyLevel` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `getByTopic` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`bankId`),
  KEY `systemId` (`systemId`),
  KEY `idx_questionType` (`questionType`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_topic` (`topic`),
  KEY `moduleId` (`moduleId`),
  CONSTRAINT `questionbank_ibfk_1` FOREIGN KEY (`systemId`) REFERENCES `anatomysystem` (`systemId`) ON DELETE SET NULL,
  CONSTRAINT `questionbank_ibfk_2` FOREIGN KEY (`moduleId`) REFERENCES `module` (`moduleId`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `questionbank`
--

INSERT INTO `questionbank` VALUES (1,'multiple_choice','easy','Anatomical Terminology',1,1,'Toward the head','[\"Toward the head\", \"Toward the feet\", \"Toward the front\", \"Toward the back\"]','Superior means toward the head or upper part of a structure','Which plane divides the body into left and right halves?',NULL,NULL),(2,'multiple_choice','easy','Anatomical Terminology',1,1,'Divides body into left and right','[\"Divides body into left and right\", \"Divides body into front and back\", \"Divides body into top and bottom\", \"Divides body diagonally\"]','The sagittal plane divides the body into left and right portions','The anatomical position has the palms facing forward.',NULL,NULL),(3,'multiple_choice','medium','Anatomical Terminology',2,1,'Away from the point of attachment','[\"Toward the point of attachment\", \"Away from the point of attachment\", \"Toward the midline\", \"Away from the midline\"]','Distal means away from the point of attachment or origin','Which bone is part of the axial skeleton?',NULL,NULL),(4,'multiple_choice','medium','Anatomical Terminology',2,1,'Closer to the surface','[\"Deeper inside\", \"Closer to the surface\", \"Toward the back\", \"Toward the front\"]','Superficial refers to structures closer to the body surface','The humerus is a bone in the arm.',NULL,NULL),(15,'multiple_choice','easy','Vertebral Column',NULL,2,'7','[\"5\", \"7\", \"12\", \"5\"]','There are 7 cervical vertebrae in the neck','Vertebral Column',NULL,NULL),(16,'multiple_choice','medium','Appendicular Skeleton',NULL,2,'Clavicle and scapula','[\"Humerus and radius\", \"Clavicle and scapula\", \"Sternum and ribs\", \"Femur and tibia\"]','The pectoral girdle consists of the clavicle and scapula','Appendicular Skeleton',NULL,NULL),(17,'multiple_choice','hard','Joint Types',NULL,2,'Ball-and-socket','[\"Hinge\", \"Pivot\", \"Ball-and-socket\", \"Gliding\"]','The shoulder joint is a ball-and-socket joint allowing multi-axial movement','Joint Types',NULL,NULL),(18,'multiple_choice','medium','Lower Limb',NULL,2,'Femur','[\"Humerus\", \"Tibia\", \"Femur\", \"Radius\"]','The femur is the longest and strongest bone in the body','Lower Limb',NULL,NULL),(19,'multiple_choice','easy','Bone Structure',NULL,2,'Compact bone','[\"Spongy bone\", \"Compact bone\", \"Cartilage\", \"Marrow\"]','The dense outer layer of bone is called compact bone','Bone Structure',NULL,NULL),(20,'multiple_choice','medium','Thoracic Cage',NULL,2,'12 pairs','[\"10 pairs\", \"11 pairs\", \"12 pairs\", \"13 pairs\"]','Humans typically have 12 pairs of ribs','Thoracic Cage',NULL,NULL),(21,'multiple_choice','hard','Bone Markings',NULL,2,'Condyle','[\"Tubercle\", \"Condyle\", \"Spine\", \"Crest\"]','A condyle is a rounded articular projection at a joint','Bone Markings',NULL,NULL),(22,'multiple_choice','medium','Axial Skeleton',NULL,2,'80','[\"70\", \"80\", \"90\", \"100\"]','The axial skeleton contains approximately 80 bones','Axial Skeleton',NULL,NULL),(23,'multiple_choice','easy','Spinal Cord',NULL,3,'At L1-L2 vertebral level','[\"At L1-L2 vertebral level\", \"At L5 vertebral level\", \"At T12 vertebral level\", \"At S1 vertebral level\"]','The spinal cord typically ends at the L1-L2 vertebral level','Spinal Cord',NULL,NULL),(24,'multiple_choice','medium','Spinal Nerves',NULL,3,'31 pairs','[\"28 pairs\", \"31 pairs\", \"33 pairs\", \"35 pairs\"]','There are 31 pairs of spinal nerves in humans','Spinal Nerves',NULL,NULL),(25,'multiple_choice','hard','Nerve Plexuses',NULL,3,'Brachial plexus','[\"Cervical plexus\", \"Brachial plexus\", \"Lumbar plexus\", \"Sacral plexus\"]','The brachial plexus innervates the upper limb','Nerve Plexuses',NULL,NULL),(26,'multiple_choice','medium','Spinal Cord Anatomy',NULL,3,'Gray matter','[\"White matter\", \"Gray matter\", \"Meninges\", \"Cerebrospinal fluid\"]','The butterfly-shaped central region contains gray matter with neuron cell bodies','Spinal Cord Anatomy',NULL,NULL),(27,'multiple_choice','easy','Meninges',NULL,3,'Dura mater','[\"Pia mater\", \"Arachnoid mater\", \"Dura mater\", \"Epidural space\"]','The dura mater is the outermost protective layer of the meninges','Meninges',NULL,NULL),(28,'multiple_choice','medium','Reflexes',NULL,3,'Monosynaptic reflex','[\"Polysynaptic reflex\", \"Monosynaptic reflex\", \"Crossed reflex\", \"Withdrawal reflex\"]','The patellar (knee-jerk) reflex is a monosynaptic reflex','Reflexes',NULL,NULL),(29,'multiple_choice','hard','Spinal Tracts',NULL,3,'Dorsal columns','[\"Spinothalamic tract\", \"Dorsal columns\", \"Corticospinal tract\", \"Spinocerebellar tract\"]','The dorsal columns carry proprioception and fine touch information','Spinal Tracts',NULL,NULL),(30,'multiple_choice','medium','Spinal Segments',NULL,3,'8 pairs','[\"7 pairs\", \"8 pairs\", \"12 pairs\", \"5 pairs\"]','There are 8 pairs of cervical spinal nerves','Spinal Segments',NULL,NULL),(31,'multiple_choice','easy','Cauda Equina',NULL,3,'Bundle of nerve roots','[\"Part of brain\", \"Bundle of nerve roots\", \"Type of vertebra\", \"Spinal ligament\"]','The cauda equina is a bundle of spinal nerve roots at the lower end of the spinal cord','Cauda Equina',NULL,NULL),(32,'multiple_choice','medium','Dermatomes',NULL,3,'Area of skin innervated by a single spinal nerve','[\"Type of skin cell\", \"Area of skin innervated by a single spinal nerve\", \"Layer of epidermis\", \"Skin receptor\"]','A dermatome is the area of skin supplied by a single spinal nerve','Dermatomes',NULL,NULL),(33,'multiple_choice','easy','Brain Structure',NULL,4,'Cerebrum','[\"Cerebellum\", \"Cerebrum\", \"Brainstem\", \"Diencephalon\"]','The cerebrum is the largest part of the brain','Brain Structure',NULL,NULL),(34,'multiple_choice','medium','Brain Lobes',NULL,4,'Occipital lobe','[\"Frontal lobe\", \"Parietal lobe\", \"Temporal lobe\", \"Occipital lobe\"]','The occipital lobe processes visual information','Brain Lobes',NULL,NULL),(35,'multiple_choice','hard','Cranial Nerves',NULL,4,'12 pairs','[\"10 pairs\", \"12 pairs\", \"14 pairs\", \"16 pairs\"]','There are 12 pairs of cranial nerves','Cranial Nerves',NULL,NULL),(36,'multiple_choice','medium','Brainstem',NULL,4,'Medulla oblongata','[\"Pons\", \"Medulla oblongata\", \"Midbrain\", \"Thalamus\"]','The medulla oblongata controls vital functions like breathing and heart rate','Brainstem',NULL,NULL),(37,'multiple_choice','easy','Brain Protection',NULL,4,'Cerebrospinal fluid','[\"Blood\", \"Cerebrospinal fluid\", \"Lymph\", \"Plasma\"]','Cerebrospinal fluid cushions and protects the brain','Brain Protection',NULL,NULL),(38,'multiple_choice','hard','Diencephalon',NULL,4,'Thalamus','[\"Hypothalamus\", \"Thalamus\", \"Pituitary\", \"Pineal gland\"]','The thalamus acts as a relay station for sensory information','Diencephalon',NULL,NULL),(39,'multiple_choice','medium','Motor Control',NULL,4,'Frontal lobe','[\"Frontal lobe\", \"Parietal lobe\", \"Temporal lobe\", \"Occipital lobe\"]','The primary motor cortex is located in the frontal lobe','Motor Control',NULL,NULL),(40,'multiple_choice','easy','Cerebellum',NULL,4,'Coordination and balance','[\"Memory\", \"Coordination and balance\", \"Vision\", \"Hearing\"]','The cerebellum coordinates movement and maintains balance','Cerebellum',NULL,NULL),(41,'multiple_choice','hard','Limbic System',NULL,4,'Hippocampus','[\"Amygdala\", \"Hippocampus\", \"Thalamus\", \"Hypothalamus\"]','The hippocampus is critical for forming new memories','Limbic System',NULL,NULL),(42,'multiple_choice','medium','Cranial Nerves',NULL,4,'Vagus nerve (CN X)','[\"Trigeminal nerve (CN V)\", \"Facial nerve (CN VII)\", \"Vagus nerve (CN X)\", \"Hypoglossal nerve (CN XII)\"]','The vagus nerve has the most widespread distribution in the body','Cranial Nerves',NULL,NULL),(43,'multiple_choice','hard','Ventricular System',NULL,4,'Four ventricles','[\"Two ventricles\", \"Three ventricles\", \"Four ventricles\", \"Five ventricles\"]','The brain contains four interconnected ventricles filled with CSF','Ventricular System',NULL,NULL),(44,'multiple_choice','medium','Brain Hemispheres',NULL,4,'Corpus callosum','[\"Corpus callosum\", \"Cerebellum\", \"Medulla\", \"Pons\"]','The corpus callosum connects the left and right cerebral hemispheres','Brain Hemispheres',NULL,NULL),(45,'multiple_choice','easy','Brain Tissue',NULL,4,'Gray matter','[\"White matter\", \"Gray matter\", \"Meninges\", \"Ventricles\"]','The cerebral cortex consists primarily of gray matter','Brain Tissue',NULL,NULL),(46,'multiple_choice','hard','Basal Ganglia',NULL,4,'Motor control and learning','[\"Vision processing\", \"Hearing processing\", \"Motor control and learning\", \"Smell processing\"]','The basal ganglia are involved in motor control and procedural learning','Basal Ganglia',NULL,NULL),(47,'multiple_choice','medium','Brainstem Components',NULL,4,'Midbrain, pons, medulla','[\"Cerebrum, cerebellum, diencephalon\", \"Midbrain, pons, medulla\", \"Thalamus, hypothalamus, pituitary\", \"Frontal, parietal, temporal\"]','The brainstem consists of the midbrain, pons, and medulla oblongata','Brainstem Components',NULL,NULL),(48,'multiple_choice','easy','Vision',NULL,5,'Retina','[\"Cornea\", \"Lens\", \"Retina\", \"Iris\"]','The retina contains photoreceptor cells (rods and cones)','Vision',NULL,NULL),(49,'multiple_choice','medium','Hearing',NULL,5,'Cochlea','[\"Semicircular canals\", \"Cochlea\", \"Vestibule\", \"Tympanic membrane\"]','The cochlea contains the organ of Corti for hearing','Hearing',NULL,NULL),(50,'multiple_choice','hard','Eye Anatomy',NULL,5,'Accommodation','[\"Pupillary reflex\", \"Accommodation\", \"Convergence\", \"Diplopia\"]','Accommodation is the process of changing lens shape to focus on near objects','Eye Anatomy',NULL,NULL),(51,'multiple_choice','medium','Taste',NULL,5,'Five basic tastes','[\"Three basic tastes\", \"Four basic tastes\", \"Five basic tastes\", \"Six basic tastes\"]','There are five basic taste sensations: sweet, sour, salty, bitter, and umami','Taste',NULL,NULL),(52,'multiple_choice','easy','Ear Anatomy',NULL,5,'Eardrum','[\"Ossicles\", \"Eardrum\", \"Cochlea\", \"Semicircular canals\"]','The tympanic membrane is commonly called the eardrum','Ear Anatomy',NULL,NULL),(53,'multiple_choice','hard','Vision',NULL,5,'Fovea centralis','[\"Optic disc\", \"Fovea centralis\", \"Macula lutea\", \"Ora serrata\"]','The fovea centralis has the highest concentration of cones for sharp central vision','Vision',NULL,NULL),(54,'multiple_choice','medium','Equilibrium',NULL,5,'Vestibular apparatus','[\"Cochlea\", \"Vestibular apparatus\", \"Ossicles\", \"Eustachian tube\"]','The vestibular apparatus detects head position and movement','Equilibrium',NULL,NULL),(55,'multiple_choice','easy','Smell',NULL,5,'Olfactory epithelium','[\"Nasal conchae\", \"Olfactory epithelium\", \"Nasal septum\", \"Paranasal sinuses\"]','Olfactory receptors are located in the olfactory epithelium','Smell',NULL,NULL),(56,'multiple_choice','medium','Eye Structures',NULL,5,'Aqueous humor','[\"Vitreous humor\", \"Aqueous humor\", \"Tears\", \"Blood\"]','Aqueous humor fills the anterior chamber of the eye','Eye Structures',NULL,NULL),(57,'multiple_choice','hard','Hearing Mechanism',NULL,5,'Hair cells','[\"Rods\", \"Cones\", \"Hair cells\", \"Ganglion cells\"]','Mechanoreceptor hair cells in the organ of Corti transduce sound vibrations','Hearing Mechanism',NULL,NULL),(58,'multiple_choice','easy','Body Planes',NULL,NULL,'Sagittal plane','[\"Sagittal plane\", \"Transverse plane\", \"Frontal plane\", \"Coronal plane\"]','The sagittal plane divides the body into right and left portions. The midsagittal plane divides it into equal right and left halves.','Body Planes',NULL,NULL),(59,'multiple_choice','easy','Directional Terms',NULL,NULL,'Toward the front','[\"Toward the front\", \"Toward the back\", \"Toward the head\", \"Toward the feet\"]','Anterior means toward the front of the body. The opposite term is posterior.','Directional Terms',NULL,NULL),(60,'true_false','easy','Directional Terms',NULL,NULL,'false',NULL,'Superior means toward the head or upper part of a structure. Inferior means toward the feet.','Directional Terms',NULL,NULL),(61,'multiple_choice','medium','Test Quiz',1,NULL,'2','[\"1\", \"2\", \"3\", \"4\"]',NULL,'What is 1+1?',NULL,NULL),(62,'multiple_choice','medium','Test Quiz',1,NULL,'2','[\"1\", \"2\", \"3\", \"4\"]',NULL,'What is 1+1?',NULL,NULL);

--
-- Table structure for table `quiz`
--

CREATE TABLE `quiz` (
  `quizId` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `moduleId` int NOT NULL,
  `timeLimit` int DEFAULT NULL,
  `totalQuestions` int NOT NULL,
  `passingScore` decimal(5,2) DEFAULT '60.00',
  `isCustom` tinyint(1) NOT NULL DEFAULT '0',
  `generatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`quizId`),
  KEY `idx_moduleId` (`moduleId`),
  KEY `idx_quiz_isCustom` (`isCustom`),
  KEY `idx_quiz_title` (`title`),
  KEY `idx_quiz_generatedAt` (`generatedAt`),
  CONSTRAINT `quiz_ibfk_1` FOREIGN KEY (`moduleId`) REFERENCES `module` (`moduleId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz`
--

INSERT INTO `quiz` VALUES (57,'Practice: LAB 1: Anatomical Language',NULL,1,30,15,60.00,0,'2026-02-26 00:46:39'),(58,'Practice: LAB 1: Anatomical Language',NULL,1,30,15,60.00,0,'2026-02-26 00:46:39'),(59,'Practice: LAB 2: Bones and Bone Markings',NULL,2,30,15,60.00,0,'2026-02-26 00:56:10'),(60,'Practice: LAB 2: Bones and Bone Markings',NULL,2,30,15,60.00,0,'2026-02-26 00:56:10'),(63,'Test Quiz','Reproduction test',1,20,1,60.00,1,'2026-02-26 01:07:20'),(65,'Test Quiz','Reproduction test',1,20,1,60.00,1,'2026-02-26 01:12:31');

--
-- Table structure for table `quizattempt`
--

CREATE TABLE `quizattempt` (
  `attemptId` int NOT NULL AUTO_INCREMENT,
  `quizId` int NOT NULL,
  `studentId` int NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime DEFAULT NULL,
  `status` enum('in_progress','completed','abandoned') COLLATE utf8mb4_unicode_ci DEFAULT 'in_progress',
  `startedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `submitAnswers` json DEFAULT NULL,
  `finishAt` datetime DEFAULT NULL,
  `getScore` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`attemptId`),
  KEY `idx_quizId` (`quizId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_status` (`status`),
  CONSTRAINT `quizattempt_ibfk_1` FOREIGN KEY (`quizId`) REFERENCES `quiz` (`quizId`) ON DELETE CASCADE,
  CONSTRAINT `quizattempt_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `student` (`studentId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quizattempt`
--

INSERT INTO `quizattempt` VALUES (67,57,1,'2026-02-26 00:53:30','2026-02-26 00:54:09','completed','2026-02-26 00:53:30','{\"correctAnswers\": 0, \"totalQuestions\": 4, \"incorrectAnswers\": 4, \"skippedQuestions\": 0, \"answeredQuestions\": 4, \"totalPointsEarned\": \"0.00\"}','2026-02-26 00:54:09',0.00),(68,57,1,'2026-02-26 00:53:30','2026-02-26 00:53:42','completed','2026-02-26 00:53:30','{\"correctAnswers\": 0, \"totalQuestions\": 4, \"incorrectAnswers\": 4, \"skippedQuestions\": 0, \"answeredQuestions\": 4, \"totalPointsEarned\": \"0.00\"}','2026-02-26 00:53:42',0.00),(69,59,1,'2026-02-26 00:56:10','2026-02-26 01:02:26','completed','2026-02-26 00:56:10','{\"correctAnswers\": 0, \"totalQuestions\": 2, \"incorrectAnswers\": 2, \"skippedQuestions\": 0, \"answeredQuestions\": 2, \"totalPointsEarned\": \"0.00\"}','2026-02-26 01:02:26',0.00),(70,60,1,'2026-02-26 00:56:10','2026-02-26 00:56:22','completed','2026-02-26 00:56:10','{\"correctAnswers\": 1, \"totalQuestions\": 2, \"incorrectAnswers\": 1, \"skippedQuestions\": 0, \"answeredQuestions\": 2, \"totalPointsEarned\": \"1.00\"}','2026-02-26 00:56:22',50.00),(72,65,1,'2026-02-26 09:49:30','2026-02-26 09:49:34','completed','2026-02-26 09:49:30','{\"correctAnswers\": 0, \"totalQuestions\": 1, \"incorrectAnswers\": 1, \"skippedQuestions\": 0, \"answeredQuestions\": 1, \"totalPointsEarned\": \"0.00\"}','2026-02-26 09:49:34',0.00),(73,63,1,'2026-03-01 15:02:01','2026-03-01 15:02:04','completed','2026-03-01 15:02:01','{\"correctAnswers\": 1, \"totalQuestions\": 1, \"incorrectAnswers\": 0, \"skippedQuestions\": 0, \"answeredQuestions\": 1, \"totalPointsEarned\": \"1.00\"}','2026-03-01 15:02:04',100.00),(74,65,1,'2026-03-01 15:13:07','2026-03-01 15:13:12','completed','2026-03-01 15:13:07','{\"correctAnswers\": 1, \"totalQuestions\": 1, \"incorrectAnswers\": 2, \"skippedQuestions\": 0, \"answeredQuestions\": 3, \"totalPointsEarned\": \"2.00\"}','2026-03-01 15:13:12',67.00),(75,65,1,'2026-03-01 15:18:19','2026-03-01 15:18:24','completed','2026-03-01 15:18:19','{\"correctAnswers\": 1, \"totalQuestions\": 1, \"incorrectAnswers\": 0, \"skippedQuestions\": 0, \"answeredQuestions\": 1, \"totalPointsEarned\": \"1.00\"}','2026-03-01 15:18:24',100.00),(76,65,1,'2026-03-01 15:25:50','2026-03-01 15:25:52','completed','2026-03-01 15:25:50','{\"correctAnswers\": 1, \"totalQuestions\": 1, \"incorrectAnswers\": 0, \"skippedQuestions\": 0, \"answeredQuestions\": 1, \"totalPointsEarned\": \"1.00\"}','2026-03-01 15:25:52',100.00),(77,65,1,'2026-03-01 15:33:22',NULL,'in_progress','2026-03-01 15:33:22',NULL,NULL,NULL);

--
-- Table structure for table `quizquestion`
--

CREATE TABLE `quizquestion` (
  `questionId` int NOT NULL AUTO_INCREMENT,
  `quizId` int DEFAULT NULL,
  `bankId` int DEFAULT NULL,
  `questionText` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `difficulty` enum('easy','medium','hard') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `points` decimal(4,2) DEFAULT '1.00',
  `displayOrder` int DEFAULT '0',
  `validateAnswer` tinyint(1) DEFAULT '1',
  `getDifficulty` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`questionId`),
  KEY `bankId` (`bankId`),
  KEY `idx_quizId` (`quizId`),
  KEY `idx_difficulty` (`difficulty`),
  CONSTRAINT `quizquestion_ibfk_1` FOREIGN KEY (`quizId`) REFERENCES `quiz` (`quizId`) ON DELETE CASCADE,
  CONSTRAINT `quizquestion_ibfk_2` FOREIGN KEY (`bankId`) REFERENCES `questionbank` (`bankId`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=507 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quizquestion`
--

INSERT INTO `quizquestion` VALUES (495,57,2,'The anatomical position has the palms facing forward.','medium',1.00,1,1,NULL),(496,57,1,'Which plane divides the body into left and right halves?','medium',1.00,1,1,NULL),(497,57,1,'Which plane divides the body into left and right halves?','medium',1.00,2,1,NULL),(498,57,2,'The anatomical position has the palms facing forward.','medium',1.00,2,1,NULL),(499,59,3,'Which bone is part of the axial skeleton?','medium',1.00,1,1,NULL),(500,60,3,'Which bone is part of the axial skeleton?','medium',1.00,1,1,NULL),(501,59,4,'The humerus is a bone in the arm.','medium',1.00,2,1,NULL),(502,60,4,'The humerus is a bone in the arm.','medium',1.00,2,1,NULL),(505,63,61,'What is 1+1?','medium',1.00,1,1,NULL),(506,65,62,'What is 1+1?','medium',1.00,1,1,NULL);

--
-- Table structure for table `reportrequest`
--

CREATE TABLE `reportrequest` (
  `requestId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `reportType` enum('student_progress','class_performance','module_analytics','system_usage') COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','processing','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`requestId`),
  KEY `idx_userId` (`userId`),
  KEY `idx_status` (`status`),
  CONSTRAINT `reportrequest_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reportrequest`
--

--
-- Table structure for table `sessionanalytics`
--

CREATE TABLE `sessionanalytics` (
  `analyticsId` int NOT NULL AUTO_INCREMENT,
  `sessionId` int NOT NULL,
  `engagementScore` decimal(5,2) DEFAULT NULL,
  `interactionCount` int DEFAULT '0',
  `timeSpent` int DEFAULT NULL,
  `fingoff` tinyint(1) DEFAULT '0',
  `focusAreas` json DEFAULT NULL,
  PRIMARY KEY (`analyticsId`),
  KEY `idx_sessionId` (`sessionId`),
  CONSTRAINT `sessionanalytics_ibfk_1` FOREIGN KEY (`sessionId`) REFERENCES `learningsession` (`sessionId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessionanalytics`
--

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `studentId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `enrollmentNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enrollmentDate` date DEFAULT NULL,
  `enrollmentModuleId` int DEFAULT NULL,
  `currentGrade` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedTeacherId` int DEFAULT NULL,
  `className` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`studentId`),
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `enrollmentNumber` (`enrollmentNumber`),
  KEY `idx_enrollmentNumber` (`enrollmentNumber`),
  CONSTRAINT `student_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `student_ibfk_2` FOREIGN KEY (`assignedTeacherId`) REFERENCES `teacher` (`teacherId`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student`
--

INSERT INTO `student` VALUES (1,6,'22i-1239','2024-01-15',NULL,'A',NULL,NULL),(2,7,'VRMTS2024002','2024-01-15',NULL,'B+',NULL,NULL),(3,8,'VRMTS2024003','2024-02-01',NULL,'A-',NULL,NULL),(4,9,'VRMTS2024004','2024-02-01',NULL,'B',NULL,NULL),(5,10,'VRMTS2024005','2024-02-15',NULL,'A-',NULL,NULL);

--
-- Table structure for table `studentmoduleassignment`
--

CREATE TABLE `studentmoduleassignment` (
  `assignmentId` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `moduleId` int NOT NULL,
  `hoursSpent` decimal(5,2) DEFAULT '0.00',
  `knowledge` decimal(5,2) DEFAULT '0.00',
  `progress` decimal(5,2) DEFAULT '0.00',
  `status` enum('not_started','in_progress','completed','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'not_started',
  `completedAt` datetime DEFAULT NULL,
  `assignedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignmentId`),
  KEY `idx_studentId` (`studentId`),
  KEY `idx_moduleId` (`moduleId`),
  KEY `idx_status` (`status`),
  CONSTRAINT `studentmoduleassignment_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `student` (`studentId`) ON DELETE CASCADE,
  CONSTRAINT `studentmoduleassignment_ibfk_2` FOREIGN KEY (`moduleId`) REFERENCES `module` (`moduleId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `studentmoduleassignment`
--

INSERT INTO `studentmoduleassignment` VALUES (1,1,1,5.00,95.00,100.00,'in_progress','2025-11-11 18:43:14','2025-12-10 14:58:24'),(2,1,2,8.00,92.00,100.00,'in_progress','2025-11-15 18:43:14','2026-02-26 09:56:31'),(7,2,1,4.50,88.00,100.00,'completed','2025-11-12 18:43:14','2025-11-09 18:43:14'),(8,2,2,7.00,85.00,100.00,'completed','2025-11-17 18:43:14','2025-11-13 18:43:14'),(12,3,1,5.50,82.00,100.00,'completed','2025-11-13 18:43:14','2025-11-09 18:43:14'),(13,3,2,6.50,79.00,100.00,'completed','2025-11-19 18:43:14','2025-11-14 18:43:14'),(16,4,1,6.00,75.00,100.00,'completed','2025-11-15 18:43:14','2025-11-09 18:43:14'),(17,4,2,8.50,72.00,100.00,'completed','2025-11-21 18:43:14','2025-11-16 18:43:14'),(19,5,1,3.50,78.00,100.00,'completed','2025-11-27 18:43:14','2025-11-24 18:43:14'),(20,5,2,4.00,80.00,85.00,'in_progress',NULL,'2025-11-28 18:43:14');

--
-- Table structure for table `systemreport`
--

CREATE TABLE `systemreport` (
  `reportId` int NOT NULL AUTO_INCREMENT,
  `adminId` int NOT NULL,
  `reportType` enum('usage','performance','analytics','audit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `period` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `generatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `format` enum('pdf','csv','json','xlsx') COLLATE utf8mb4_unicode_ci DEFAULT 'pdf',
  `distribute` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`reportId`),
  KEY `idx_adminId` (`adminId`),
  KEY `idx_reportType` (`reportType`),
  CONSTRAINT `systemreport_ibfk_1` FOREIGN KEY (`adminId`) REFERENCES `admin` (`adminId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `systemreport`
--

--
-- Table structure for table `teacher`
--

CREATE TABLE `teacher` (
  `teacherId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`teacherId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `teacher_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher`
--

INSERT INTO `teacher` VALUES (1,3,'Anatomy & Physiology'),(2,4,'Neuroscience'),(3,5,'Clinical Sciences');

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  `lastLogin` datetime DEFAULT NULL,
  `userType` enum('student','teacher','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`userId`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_userType` (`userType`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` VALUES (1,'ad1@vrmts.edu','1234','Dr. Sarah Mitchell','2025-12-09 18:37:37',NULL,'admin',1),(2,'ad2@vrmts.edu','1234','Prof. James Carter','2025-12-09 18:37:37',NULL,'admin',1),(3,'te1@vrmts.edu','1234','Dr. Emily Johnson','2025-12-09 18:37:37','2026-02-26 09:57:40','teacher',1),(4,'te2@vrmts.edu','1234','Dr. Michael Chen','2025-12-09 18:37:37',NULL,'teacher',1),(5,'te3@vrmts.edu','1234','Dr. Rachel Martinez','2025-12-09 18:37:37',NULL,'teacher',1),(6,'st1@vrmts.edu','1234','Alex Thompson','2025-12-09 18:37:37','2026-03-01 15:01:50','student',1),(7,'st2@vrmts.edu','1234','Maria Garcia','2025-12-09 18:37:37',NULL,'student',1),(8,'st3@vrmts.edu','1234','David Lee','2025-12-09 18:37:37',NULL,'student',1),(9,'st@vrmts.edu','1234','Sophie Williams','2025-12-09 18:37:37',NULL,'student',1),(10,'st5@vrmts.edu','1234','James Anderson','2025-12-09 18:37:37',NULL,'student',1);

--
-- Table structure for table `useraccessibility`
--

CREATE TABLE `useraccessibility` (
  `accessibilityId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `textSize` int DEFAULT '16',
  `highContrast` tinyint(1) DEFAULT '0',
  `reduceMotion` tinyint(1) DEFAULT '0',
  `screenReader` tinyint(1) DEFAULT '0',
  `keyboardNav` tinyint(1) DEFAULT '1',
  `captions` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`accessibilityId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `useraccessibility_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `useraccessibility`
--

INSERT INTO `useraccessibility` VALUES (1,1,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(2,2,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(3,3,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(4,4,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(5,5,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(6,6,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(7,7,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(8,8,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(9,9,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(10,10,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01');

--
-- Table structure for table `usernotifications`
--

CREATE TABLE `usernotifications` (
  `notificationId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `assignments` tinyint(1) DEFAULT '1',
  `quizDeadlines` tinyint(1) DEFAULT '1',
  `performance` tinyint(1) DEFAULT '1',
  `announcements` tinyint(1) DEFAULT '0',
  `emailDigest` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'weekly',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`notificationId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `usernotifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usernotifications`
--

INSERT INTO `usernotifications` VALUES (1,1,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(2,2,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(3,3,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(4,4,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(5,5,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(6,6,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(7,7,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(8,8,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(9,9,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(10,10,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01');

--
-- Table structure for table `userpreferences`
--

CREATE TABLE `userpreferences` (
  `preferenceId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `theme` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'dark',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `timeZone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'UTC+05:00',
  `dateFormat` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'MM/DD/YYYY',
  `defaultView` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'grid',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`preferenceId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `userpreferences_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `userpreferences`
--

INSERT INTO `userpreferences` VALUES (1,1,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(2,2,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(3,3,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(4,4,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(5,5,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(6,6,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(7,7,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(8,8,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(9,9,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(10,10,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54');

-- ============================================================
-- Runtime compatibility patch
-- Keeps dbtables.sql aligned with backend controllers.
-- ============================================================

-- Safe column-add: works on MySQL versions that don't support ADD COLUMN IF NOT EXISTS
SET @dbname = DATABASE();
SET @preparedStatement = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `quiz` ADD COLUMN `isComprehensive` tinyint(1) NOT NULL DEFAULT \'0\'',
    'SELECT 1 -- column already exists, skipping'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'quiz'
    AND COLUMN_NAME = 'isComprehensive'
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `ai_question_staging` (
  `stagingId` int NOT NULL AUTO_INCREMENT,
  `instructorId` int NOT NULL,
  `labNum` int NOT NULL,
  `questionText` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` json NOT NULL,
  `correctIndex` int NOT NULL,
  `explanation` text COLLATE utf8mb4_unicode_ci,
  `difficulty` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stagingId`),
  KEY `idx_instructorId` (`instructorId`),
  KEY `idx_status` (`status`),
  KEY `idx_labNum` (`labNum`),
  CONSTRAINT `ai_question_staging_ibfk_1` FOREIGN KEY (`instructorId`) REFERENCES `teacher` (`teacherId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;