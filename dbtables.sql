-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)

USE vrmts;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `sessions` WRITE;
INSERT INTO `sessions` VALUES ('bCqskdfS3wJBwGe2zp_DlTktsRg49lOk',1772448446,'{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-03-02T10:01:50.849Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"user\":{\"userId\":6,\"email\":\"st1@vrmts.edu\",\"name\":\"Alex Thompson\",\"userType\":\"student\"}}');
UNLOCK TABLES;

--
-- Host: localhost    Database: vrmts
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `adminId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  PRIMARY KEY (`adminId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,1),(2,2);
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `aichat`
--

DROP TABLE IF EXISTS `aichat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aichat`
--

LOCK TABLES `aichat` WRITE;
/*!40000 ALTER TABLE `aichat` DISABLE KEYS */;
/*!40000 ALTER TABLE `aichat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `aifeedback`
--

DROP TABLE IF EXISTS `aifeedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aifeedback`
--

LOCK TABLES `aifeedback` WRITE;
/*!40000 ALTER TABLE `aifeedback` DISABLE KEYS */;
INSERT INTO `aifeedback` VALUES (1,NULL,1,'You scored 20% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2025-12-10 03:27:34',1,1),(2,NULL,1,'You scored 50% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2025-12-10 03:46:54',1,1),(3,NULL,1,'You scored 30% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2025-12-10 10:31:11',1,1),(4,NULL,1,'You scored 40% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2025-12-10 14:46:18',1,1),(5,NULL,1,'You scored 30% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-01-15 04:18:33',1,1),(6,NULL,1,'You scored 10% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-17 03:27:17',1,1),(7,NULL,1,'You scored 58% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-17 03:57:30',1,1),(8,NULL,1,'You scored 73% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-02-17 04:30:15',1,1),(9,NULL,1,'You scored 5% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-17 04:37:03',1,1),(10,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:02:24',1,1),(11,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:02:24',1,1),(12,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:02:53',1,1),(13,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:02:53',1,1),(14,NULL,1,'You scored 18% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:03:50',1,1),(15,NULL,1,'You scored 12% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:13:55',1,1),(16,NULL,1,'You scored 12% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:33:46',1,1),(17,NULL,1,'You scored 9% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:34:33',1,1),(18,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:41:49',1,1),(19,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:41:49',1,1),(20,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:41:59',1,1),(21,NULL,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:41:59',1,1),(22,68,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:53:42',1,1),(23,67,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:54:09',1,1),(24,70,1,'You scored 50% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 00:56:22',1,1),(25,69,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 01:02:26',1,1),(26,71,1,'You scored 100% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 01:02:40',1,1),(27,72,1,'You scored 0% on this quiz. Keep practicing to improve your score.','Focus on reviewing the questions you got wrong.',0.80,'2026-02-26 09:49:34',1,1),(28,73,1,'You scored 100% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-03-01 15:02:04',1,1),(29,74,1,'You scored 67% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-03-01 15:13:12',1,1),(30,75,1,'You scored 100% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-03-01 15:18:24',1,1),(31,76,1,'You scored 100% on this quiz. Great job!','Focus on reviewing the questions you got wrong.',0.80,'2026-03-01 15:25:52',1,1);
/*!40000 ALTER TABLE `aifeedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analyticsdata`
--

DROP TABLE IF EXISTS `analyticsdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyticsdata`
--

LOCK TABLES `analyticsdata` WRITE;
/*!40000 ALTER TABLE `analyticsdata` DISABLE KEYS */;
INSERT INTO `analyticsdata` VALUES (1,1,'2025-12-02',90,1,5,92.00,1),(2,1,'2025-12-03',75,0,4,NULL,1),(3,1,'2025-12-08',60,0,3,NULL,1),(4,2,'2025-12-04',80,1,6,85.00,1),(5,2,'2025-12-08',60,0,4,NULL,1),(6,3,'2025-12-06',70,0,3,NULL,1),(7,1,'2025-12-02',90,1,5,92.00,1),(8,1,'2025-12-03',75,0,4,NULL,1),(9,1,'2025-12-08',60,0,3,NULL,1),(10,2,'2025-12-04',80,1,6,85.00,1),(11,2,'2025-12-08',60,0,4,NULL,1),(12,3,'2025-12-06',70,0,3,NULL,1);
/*!40000 ALTER TABLE `analyticsdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `anatomymodel`
--

DROP TABLE IF EXISTS `anatomymodel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anatomymodel`
--

LOCK TABLES `anatomymodel` WRITE;
/*!40000 ALTER TABLE `anatomymodel` DISABLE KEYS */;
INSERT INTO `anatomymodel` VALUES (1,2,'Full Skeleton','1.0','/dummy/thumb/skeleton.jpg','/dummy/models/skeleton.glb',NULL,NULL,1,0,NULL),(2,7,'Heart Anatomy','1.0','/dummy/thumb/heart.jpg','/dummy/models/heart.glb',NULL,NULL,1,0,NULL),(3,6,'Lungs Model','1.0','/dummy/thumb/lungs.jpg','/dummy/models/lungs.glb',NULL,NULL,1,0,NULL),(4,4,'Brain Model','1.0','/dummy/thumb/brain.jpg','/dummy/models/brain.glb',NULL,NULL,1,0,NULL),(5,11,'Muscle System','1.0','/dummy/thumb/muscles.jpg','/dummy/models/muscles.glb',NULL,NULL,1,0,NULL);
/*!40000 ALTER TABLE `anatomymodel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `anatomysystem`
--

DROP TABLE IF EXISTS `anatomysystem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anatomysystem` (
  `systemId` int NOT NULL AUTO_INCREMENT,
  `systemName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`systemId`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anatomysystem`
--

LOCK TABLES `anatomysystem` WRITE;
/*!40000 ALTER TABLE `anatomysystem` DISABLE KEYS */;
INSERT INTO `anatomysystem` VALUES (1,'Anatomical Terminology','Foundation concepts, planes, and directional terms','Foundation'),(2,'Skeletal System','Bones, joints, and skeletal structure','Musculoskeletal'),(3,'Nervous System - Spinal','Spinal cord, spinal nerves, and reflexes','Neurological'),(4,'Nervous System - Brain','Brain structures and cranial nerves','Neurological'),(5,'Special Senses','Vision, hearing, taste, smell, and equilibrium','Sensory'),(6,'Respiratory System','Airways, lungs, and gas exchange','Respiratory'),(7,'Cardiovascular System','Heart, blood vessels, and circulation','Circulatory'),(8,'Digestive System','Alimentary canal and digestive organs','Digestive'),(9,'Urinary System','Kidneys and urinary tract','Excretory'),(10,'Reproductive System','Male and female reproductive organs','Reproductive'),(11,'Muscular System','Skeletal muscles and muscle groups','Musculoskeletal');
/*!40000 ALTER TABLE `anatomysystem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `answerrecord`
--

DROP TABLE IF EXISTS `answerrecord`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answerrecord`
--

LOCK TABLES `answerrecord` WRITE;
/*!40000 ALTER TABLE `answerrecord` DISABLE KEYS */;
INSERT INTO `answerrecord` VALUES (203,68,497,'Toward the feet',0,0.00,0,1,1),(204,68,498,'Divides body diagonally',0,0.00,0,1,1),(205,68,496,'Toward the front',0,0.00,0,1,1),(206,68,495,'Divides body diagonally',0,0.00,0,1,1),(207,67,497,'Toward the feet',0,0.00,0,1,1),(208,67,496,'Toward the back',0,0.00,0,1,1),(209,67,495,'Updated',0,0.00,0,1,1),(210,67,498,'Divides body into top and bottom',0,0.00,0,1,1),(211,70,502,'Toward the front',0,0.00,0,1,1),(212,70,500,'Away from the point of attachment',1,1.00,0,1,1),(213,69,499,'Toward the midline',0,0.00,0,1,1),(214,69,501,'Toward the front',0,0.00,0,1,1),(215,71,504,'Standing upright, arms at sides, palms forward',1,1.00,0,1,1),(216,71,503,'Frontal plane',1,1.00,0,1,1),(217,72,506,'1',0,0.00,0,1,1),(218,73,505,'2',1,1.00,0,1,1),(221,74,506,'2',1,1.00,0,1,1),(225,75,506,'2',1,1.00,0,1,1),(228,76,506,'2',1,1.00,0,1,1);
/*!40000 ALTER TABLE `answerrecord` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `learningsession`
--

DROP TABLE IF EXISTS `learningsession`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `learningsession`
--

LOCK TABLES `learningsession` WRITE;
/*!40000 ALTER TABLE `learningsession` DISABLE KEYS */;
INSERT INTO `learningsession` VALUES (1,1,5,'2025-12-09 16:44:07','2025-12-09 17:44:07','study',60,1,1),(2,2,4,'2025-12-09 15:44:07','2025-12-09 16:44:07','study',60,1,1),(3,3,3,'2025-12-09 13:44:07','2025-12-09 14:44:07','practice',60,1,1),(4,4,3,'2025-12-08 18:44:07','2025-12-08 19:29:07','study',45,1,1),(5,5,2,'2025-12-09 14:44:07','2025-12-09 15:44:07','study',60,1,1);
/*!40000 ALTER TABLE `learningsession` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modelinteraction`
--

DROP TABLE IF EXISTS `modelinteraction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modelinteraction`
--

LOCK TABLES `modelinteraction` WRITE;
/*!40000 ALTER TABLE `modelinteraction` DISABLE KEYS */;
/*!40000 ALTER TABLE `modelinteraction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module` (
  `moduleId` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `difficultyLevel` enum('beginner','intermediate','advanced') COLLATE utf8mb4_unicode_ci DEFAULT 'beginner',
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`moduleId`),
  KEY `idx_difficultyLevel` (`difficultyLevel`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--

LOCK TABLES `module` WRITE;
/*!40000 ALTER TABLE `module` DISABLE KEYS */;
INSERT INTO `module` VALUES (1,'LAB 1: Anatomical Language','beginner','Introduction to anatomical terminology, body planes, directional terms, and anatomical position','2025-12-09 18:39:40'),(2,'LAB 2: Bones and Bone Markings','beginner','Study of skeletal structure, bone classifications, and anatomical landmarks','2025-12-09 18:39:40'),(3,'LAB 3: Spinal Cord and Spinal Nerves','intermediate','Examination of spinal cord anatomy, spinal nerve organization, and plexuses','2025-12-09 18:39:40'),(4,'LAB 4: Brain and Cranial Nerves','advanced','Detailed study of brain structures, functional areas, and cranial nerves','2025-12-09 18:39:40'),(5,'LAB 5: Special Senses','intermediate','Exploration of sensory organs including vision, hearing, taste, and smell','2025-12-09 18:39:40'),(6,'LAB 6: Respiratory System','intermediate','Study of respiratory anatomy, gas exchange, and breathing mechanics','2025-12-09 18:39:40'),(7,'LAB 7: The Cardiovascular System','intermediate','Comprehensive study of heart anatomy, blood vessels, and circulation','2025-12-09 18:39:40'),(8,'LAB 8: Digestive System','intermediate','Examination of digestive organs and digestive processes','2025-12-09 18:39:40'),(9,'LAB 9: Urinary and Reproductive Systems','advanced','Study of urinary tract and reproductive system structures','2025-12-09 18:39:40'),(10,'LAB 10: The Muscular System','intermediate','Analysis of muscle anatomy, muscle groups, and functional movements','2025-12-09 18:39:40'),(12,'LAB 1: Anatomical Language','beginner','Introduction to anatomical terminology','2025-12-10 03:00:33');
/*!40000 ALTER TABLE `module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modulecontent`
--

DROP TABLE IF EXISTS `modulecontent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modulecontent`
--

LOCK TABLES `modulecontent` WRITE;
/*!40000 ALTER TABLE `modulecontent` DISABLE KEYS */;
INSERT INTO `modulecontent` VALUES (1,1,NULL,'video',NULL,'Introduction to Anatomical Terminology',1,12,1),(2,1,NULL,'interactive',NULL,'Body Planes and Sections',2,15,1),(3,1,NULL,'quiz',NULL,'Anatomical Language Quiz',3,20,1),(4,2,NULL,'video',NULL,'Skeletal System Overview',1,15,1),(5,2,NULL,'3d_model',NULL,'Complete Skeleton Model',2,25,1),(6,2,NULL,'quiz',NULL,'Bones Quiz',3,25,1),(7,3,NULL,'video',NULL,'Spinal Cord Anatomy',1,18,1),(8,3,NULL,'interactive',NULL,'Spinal Nerves',2,20,1),(9,3,NULL,'quiz',NULL,'Spinal System Quiz',3,25,1),(10,4,NULL,'video',NULL,'Brain Structure',1,20,1),(11,4,NULL,'3d_model',NULL,'Brain Model',2,30,1),(12,4,NULL,'quiz',NULL,'Brain Quiz',3,30,1),(13,5,NULL,'video',NULL,'Special Senses Overview',1,15,1),(14,5,NULL,'3d_model',NULL,'Eye and Ear Models',2,25,1),(15,5,NULL,'quiz',NULL,'Senses Quiz',3,25,1),(16,6,NULL,'video',NULL,'Respiratory System',1,15,1),(17,6,NULL,'3d_model',NULL,'Lungs Model',2,25,1),(18,6,NULL,'quiz',NULL,'Respiratory Quiz',3,25,1),(19,7,NULL,'video',NULL,'Cardiovascular Overview',1,18,1),(20,7,NULL,'3d_model',NULL,'Heart Model',2,30,1),(21,7,NULL,'quiz',NULL,'Cardiovascular Quiz',3,30,1),(22,8,NULL,'video',NULL,'Digestive System',1,15,1),(23,8,NULL,'interactive',NULL,'Digestive Process',2,20,1),(24,8,NULL,'quiz',NULL,'Digestive Quiz',3,25,1),(25,9,NULL,'video',NULL,'Urinary and Reproductive Systems',1,20,1),(26,9,NULL,'3d_model',NULL,'System Models',2,30,1),(27,9,NULL,'quiz',NULL,'Systems Quiz',3,30,1),(28,10,NULL,'video',NULL,'Muscular System',1,15,1),(29,10,NULL,'3d_model',NULL,'Muscle Groups',2,30,1),(30,10,NULL,'quiz',NULL,'Muscular Quiz',3,25,1);
/*!40000 ALTER TABLE `modulecontent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (1,6,'Great Progress!','You have completed 4 modules!','2025-12-09 18:44:49',0,'success',0,0),(2,7,'Quiz Available','New quiz available for Lab 4','2025-12-09 16:44:49',0,'info',0,0),(3,8,'Keep Going','You are making good progress on Lab 3','2025-12-08 18:44:49',1,'info',0,0),(4,9,'Study Reminder','Continue your learning streak','2025-12-09 15:44:49',0,'reminder',0,0),(5,10,'Welcome!','Welcome to VRMTS Learning Platform','2025-11-24 18:44:49',1,'info',0,0),(6,6,'Great Progress!','You have completed 4 modules!','2025-12-09 18:45:15',0,'success',0,0),(7,7,'Quiz Available','New quiz available for Lab 4','2025-12-09 16:45:15',0,'info',0,0),(8,8,'Keep Going','You are making good progress on Lab 3','2025-12-08 18:45:15',1,'info',0,0),(9,9,'Study Reminder','Continue your learning streak','2025-12-09 15:45:15',0,'reminder',0,0),(10,10,'Welcome!','Welcome to VRMTS Learning Platform','2025-11-24 18:45:15',1,'info',0,0);
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questionbank`
--

DROP TABLE IF EXISTS `questionbank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questionbank`
--

LOCK TABLES `questionbank` WRITE;
/*!40000 ALTER TABLE `questionbank` DISABLE KEYS */;
INSERT INTO `questionbank` VALUES (1,'multiple_choice','easy','Anatomical Terminology',1,1,'Toward the head','[\"Toward the head\", \"Toward the feet\", \"Toward the front\", \"Toward the back\"]','Superior means toward the head or upper part of a structure','Which plane divides the body into left and right halves?',NULL,NULL),(2,'multiple_choice','easy','Anatomical Terminology',1,1,'Divides body into left and right','[\"Divides body into left and right\", \"Divides body into front and back\", \"Divides body into top and bottom\", \"Divides body diagonally\"]','The sagittal plane divides the body into left and right portions','The anatomical position has the palms facing forward.',NULL,NULL),(3,'multiple_choice','medium','Anatomical Terminology',2,1,'Away from the point of attachment','[\"Toward the point of attachment\", \"Away from the point of attachment\", \"Toward the midline\", \"Away from the midline\"]','Distal means away from the point of attachment or origin','Which bone is part of the axial skeleton?',NULL,NULL),(4,'multiple_choice','medium','Anatomical Terminology',2,1,'Closer to the surface','[\"Deeper inside\", \"Closer to the surface\", \"Toward the back\", \"Toward the front\"]','Superficial refers to structures closer to the body surface','The humerus is a bone in the arm.',NULL,NULL),(5,'multiple_choice','easy','Body Planes',3,1,'Frontal plane','[\"Sagittal plane\", \"Transverse plane\", \"Frontal plane\", \"Oblique plane\"]','The frontal (coronal) plane divides the body into anterior and posterior portions','How many cervical vertebrae are there?',NULL,NULL),(6,'multiple_choice','medium','Anatomical Position',3,1,'Standing upright, arms at sides, palms forward','[\"Standing upright, arms at sides, palms forward\", \"Lying down, arms crossed\", \"Standing upright, arms raised\", \"Sitting position\"]','Anatomical position is the standard reference position in anatomy','The spinal cord is part of the central nervous system.',NULL,NULL),(7,'multiple_choice','hard','Anatomical Terminology',4,1,'Ipsilateral','[\"On opposite sides\", \"Ipsilateral\", \"Above\", \"Below\"]','Ipsilateral means on the same side of the body','Which lobe is primarily responsible for vision?',NULL,NULL),(8,'multiple_choice','medium','Body Cavities',4,1,'Thoracic cavity','[\"Abdominal cavity\", \"Pelvic cavity\", \"Thoracic cavity\", \"Cranial cavity\"]','The thoracic cavity contains the heart and lungs','There are 12 pairs of cranial nerves.',NULL,NULL),(9,'multiple_choice','easy','Anatomical Terminology',5,1,'Toward the back','[\"Toward the front\", \"Toward the back\", \"Toward the side\", \"Toward the middle\"]','Posterior means toward the back of the body','Where are the photoreceptors for vision located?',NULL,NULL),(10,'multiple_choice','medium','Directional Terms',6,1,'Lateral','[\"Medial\", \"Lateral\", \"Proximal\", \"Distal\"]','Lateral means away from the midline of the body','Gas exchange in the lungs occurs in the:',NULL,NULL),(11,'multiple_choice','easy','Skeletal System',7,2,'206','[\"195\", \"206\", \"215\", \"220\"]','The adult human skeleton typically contains 206 bones','Which chamber pumps blood to the body?',NULL,NULL),(12,'multiple_choice','medium','Bone Types',8,2,'Humerus','[\"Vertebra\", \"Patella\", \"Humerus\", \"Scapula\"]','The humerus is classified as a long bone','Most nutrient absorption occurs in the:',NULL,NULL),(13,'multiple_choice','medium','Skull',9,2,'Frontal bone','[\"Occipital bone\", \"Frontal bone\", \"Temporal bone\", \"Sphenoid bone\"]','The frontal bone forms the forehead','The functional unit of the kidney is the:',NULL,NULL),(14,'multiple_choice','hard','Bone Markings',10,2,'Foramen','[\"Ridge\", \"Foramen\", \"Process\", \"Fossa\"]','A foramen is a hole or opening in a bone for nerves and blood vessels','Which type of muscle is voluntary?',NULL,NULL),(15,'multiple_choice','easy','Vertebral Column',NULL,2,'7','[\"5\", \"7\", \"12\", \"5\"]','There are 7 cervical vertebrae in the neck','Vertebral Column',NULL,NULL),(16,'multiple_choice','medium','Appendicular Skeleton',NULL,2,'Clavicle and scapula','[\"Humerus and radius\", \"Clavicle and scapula\", \"Sternum and ribs\", \"Femur and tibia\"]','The pectoral girdle consists of the clavicle and scapula','Appendicular Skeleton',NULL,NULL),(17,'multiple_choice','hard','Joint Types',NULL,2,'Ball-and-socket','[\"Hinge\", \"Pivot\", \"Ball-and-socket\", \"Gliding\"]','The shoulder joint is a ball-and-socket joint allowing multi-axial movement','Joint Types',NULL,NULL),(18,'multiple_choice','medium','Lower Limb',NULL,2,'Femur','[\"Humerus\", \"Tibia\", \"Femur\", \"Radius\"]','The femur is the longest and strongest bone in the body','Lower Limb',NULL,NULL),(19,'multiple_choice','easy','Bone Structure',NULL,2,'Compact bone','[\"Spongy bone\", \"Compact bone\", \"Cartilage\", \"Marrow\"]','The dense outer layer of bone is called compact bone','Bone Structure',NULL,NULL),(20,'multiple_choice','medium','Thoracic Cage',NULL,2,'12 pairs','[\"10 pairs\", \"11 pairs\", \"12 pairs\", \"13 pairs\"]','Humans typically have 12 pairs of ribs','Thoracic Cage',NULL,NULL),(21,'multiple_choice','hard','Bone Markings',NULL,2,'Condyle','[\"Tubercle\", \"Condyle\", \"Spine\", \"Crest\"]','A condyle is a rounded articular projection at a joint','Bone Markings',NULL,NULL),(22,'multiple_choice','medium','Axial Skeleton',NULL,2,'80','[\"70\", \"80\", \"90\", \"100\"]','The axial skeleton contains approximately 80 bones','Axial Skeleton',NULL,NULL),(23,'multiple_choice','easy','Spinal Cord',NULL,3,'At L1-L2 vertebral level','[\"At L1-L2 vertebral level\", \"At L5 vertebral level\", \"At T12 vertebral level\", \"At S1 vertebral level\"]','The spinal cord typically ends at the L1-L2 vertebral level','Spinal Cord',NULL,NULL),(24,'multiple_choice','medium','Spinal Nerves',NULL,3,'31 pairs','[\"28 pairs\", \"31 pairs\", \"33 pairs\", \"35 pairs\"]','There are 31 pairs of spinal nerves in humans','Spinal Nerves',NULL,NULL),(25,'multiple_choice','hard','Nerve Plexuses',NULL,3,'Brachial plexus','[\"Cervical plexus\", \"Brachial plexus\", \"Lumbar plexus\", \"Sacral plexus\"]','The brachial plexus innervates the upper limb','Nerve Plexuses',NULL,NULL),(26,'multiple_choice','medium','Spinal Cord Anatomy',NULL,3,'Gray matter','[\"White matter\", \"Gray matter\", \"Meninges\", \"Cerebrospinal fluid\"]','The butterfly-shaped central region contains gray matter with neuron cell bodies','Spinal Cord Anatomy',NULL,NULL),(27,'multiple_choice','easy','Meninges',NULL,3,'Dura mater','[\"Pia mater\", \"Arachnoid mater\", \"Dura mater\", \"Epidural space\"]','The dura mater is the outermost protective layer of the meninges','Meninges',NULL,NULL),(28,'multiple_choice','medium','Reflexes',NULL,3,'Monosynaptic reflex','[\"Polysynaptic reflex\", \"Monosynaptic reflex\", \"Crossed reflex\", \"Withdrawal reflex\"]','The patellar (knee-jerk) reflex is a monosynaptic reflex','Reflexes',NULL,NULL),(29,'multiple_choice','hard','Spinal Tracts',NULL,3,'Dorsal columns','[\"Spinothalamic tract\", \"Dorsal columns\", \"Corticospinal tract\", \"Spinocerebellar tract\"]','The dorsal columns carry proprioception and fine touch information','Spinal Tracts',NULL,NULL),(30,'multiple_choice','medium','Spinal Segments',NULL,3,'8 pairs','[\"7 pairs\", \"8 pairs\", \"12 pairs\", \"5 pairs\"]','There are 8 pairs of cervical spinal nerves','Spinal Segments',NULL,NULL),(31,'multiple_choice','easy','Cauda Equina',NULL,3,'Bundle of nerve roots','[\"Part of brain\", \"Bundle of nerve roots\", \"Type of vertebra\", \"Spinal ligament\"]','The cauda equina is a bundle of spinal nerve roots at the lower end of the spinal cord','Cauda Equina',NULL,NULL),(32,'multiple_choice','medium','Dermatomes',NULL,3,'Area of skin innervated by a single spinal nerve','[\"Type of skin cell\", \"Area of skin innervated by a single spinal nerve\", \"Layer of epidermis\", \"Skin receptor\"]','A dermatome is the area of skin supplied by a single spinal nerve','Dermatomes',NULL,NULL),(33,'multiple_choice','easy','Brain Structure',NULL,4,'Cerebrum','[\"Cerebellum\", \"Cerebrum\", \"Brainstem\", \"Diencephalon\"]','The cerebrum is the largest part of the brain','Brain Structure',NULL,NULL),(34,'multiple_choice','medium','Brain Lobes',NULL,4,'Occipital lobe','[\"Frontal lobe\", \"Parietal lobe\", \"Temporal lobe\", \"Occipital lobe\"]','The occipital lobe processes visual information','Brain Lobes',NULL,NULL),(35,'multiple_choice','hard','Cranial Nerves',NULL,4,'12 pairs','[\"10 pairs\", \"12 pairs\", \"14 pairs\", \"16 pairs\"]','There are 12 pairs of cranial nerves','Cranial Nerves',NULL,NULL),(36,'multiple_choice','medium','Brainstem',NULL,4,'Medulla oblongata','[\"Pons\", \"Medulla oblongata\", \"Midbrain\", \"Thalamus\"]','The medulla oblongata controls vital functions like breathing and heart rate','Brainstem',NULL,NULL),(37,'multiple_choice','easy','Brain Protection',NULL,4,'Cerebrospinal fluid','[\"Blood\", \"Cerebrospinal fluid\", \"Lymph\", \"Plasma\"]','Cerebrospinal fluid cushions and protects the brain','Brain Protection',NULL,NULL),(38,'multiple_choice','hard','Diencephalon',NULL,4,'Thalamus','[\"Hypothalamus\", \"Thalamus\", \"Pituitary\", \"Pineal gland\"]','The thalamus acts as a relay station for sensory information','Diencephalon',NULL,NULL),(39,'multiple_choice','medium','Motor Control',NULL,4,'Frontal lobe','[\"Frontal lobe\", \"Parietal lobe\", \"Temporal lobe\", \"Occipital lobe\"]','The primary motor cortex is located in the frontal lobe','Motor Control',NULL,NULL),(40,'multiple_choice','easy','Cerebellum',NULL,4,'Coordination and balance','[\"Memory\", \"Coordination and balance\", \"Vision\", \"Hearing\"]','The cerebellum coordinates movement and maintains balance','Cerebellum',NULL,NULL),(41,'multiple_choice','hard','Limbic System',NULL,4,'Hippocampus','[\"Amygdala\", \"Hippocampus\", \"Thalamus\", \"Hypothalamus\"]','The hippocampus is critical for forming new memories','Limbic System',NULL,NULL),(42,'multiple_choice','medium','Cranial Nerves',NULL,4,'Vagus nerve (CN X)','[\"Trigeminal nerve (CN V)\", \"Facial nerve (CN VII)\", \"Vagus nerve (CN X)\", \"Hypoglossal nerve (CN XII)\"]','The vagus nerve has the most widespread distribution in the body','Cranial Nerves',NULL,NULL),(43,'multiple_choice','hard','Ventricular System',NULL,4,'Four ventricles','[\"Two ventricles\", \"Three ventricles\", \"Four ventricles\", \"Five ventricles\"]','The brain contains four interconnected ventricles filled with CSF','Ventricular System',NULL,NULL),(44,'multiple_choice','medium','Brain Hemispheres',NULL,4,'Corpus callosum','[\"Corpus callosum\", \"Cerebellum\", \"Medulla\", \"Pons\"]','The corpus callosum connects the left and right cerebral hemispheres','Brain Hemispheres',NULL,NULL),(45,'multiple_choice','easy','Brain Tissue',NULL,4,'Gray matter','[\"White matter\", \"Gray matter\", \"Meninges\", \"Ventricles\"]','The cerebral cortex consists primarily of gray matter','Brain Tissue',NULL,NULL),(46,'multiple_choice','hard','Basal Ganglia',NULL,4,'Motor control and learning','[\"Vision processing\", \"Hearing processing\", \"Motor control and learning\", \"Smell processing\"]','The basal ganglia are involved in motor control and procedural learning','Basal Ganglia',NULL,NULL),(47,'multiple_choice','medium','Brainstem Components',NULL,4,'Midbrain, pons, medulla','[\"Cerebrum, cerebellum, diencephalon\", \"Midbrain, pons, medulla\", \"Thalamus, hypothalamus, pituitary\", \"Frontal, parietal, temporal\"]','The brainstem consists of the midbrain, pons, and medulla oblongata','Brainstem Components',NULL,NULL),(48,'multiple_choice','easy','Vision',NULL,5,'Retina','[\"Cornea\", \"Lens\", \"Retina\", \"Iris\"]','The retina contains photoreceptor cells (rods and cones)','Vision',NULL,NULL),(49,'multiple_choice','medium','Hearing',NULL,5,'Cochlea','[\"Semicircular canals\", \"Cochlea\", \"Vestibule\", \"Tympanic membrane\"]','The cochlea contains the organ of Corti for hearing','Hearing',NULL,NULL),(50,'multiple_choice','hard','Eye Anatomy',NULL,5,'Accommodation','[\"Pupillary reflex\", \"Accommodation\", \"Convergence\", \"Diplopia\"]','Accommodation is the process of changing lens shape to focus on near objects','Eye Anatomy',NULL,NULL),(51,'multiple_choice','medium','Taste',NULL,5,'Five basic tastes','[\"Three basic tastes\", \"Four basic tastes\", \"Five basic tastes\", \"Six basic tastes\"]','There are five basic taste sensations: sweet, sour, salty, bitter, and umami','Taste',NULL,NULL),(52,'multiple_choice','easy','Ear Anatomy',NULL,5,'Eardrum','[\"Ossicles\", \"Eardrum\", \"Cochlea\", \"Semicircular canals\"]','The tympanic membrane is commonly called the eardrum','Ear Anatomy',NULL,NULL),(53,'multiple_choice','hard','Vision',NULL,5,'Fovea centralis','[\"Optic disc\", \"Fovea centralis\", \"Macula lutea\", \"Ora serrata\"]','The fovea centralis has the highest concentration of cones for sharp central vision','Vision',NULL,NULL),(54,'multiple_choice','medium','Equilibrium',NULL,5,'Vestibular apparatus','[\"Cochlea\", \"Vestibular apparatus\", \"Ossicles\", \"Eustachian tube\"]','The vestibular apparatus detects head position and movement','Equilibrium',NULL,NULL),(55,'multiple_choice','easy','Smell',NULL,5,'Olfactory epithelium','[\"Nasal conchae\", \"Olfactory epithelium\", \"Nasal septum\", \"Paranasal sinuses\"]','Olfactory receptors are located in the olfactory epithelium','Smell',NULL,NULL),(56,'multiple_choice','medium','Eye Structures',NULL,5,'Aqueous humor','[\"Vitreous humor\", \"Aqueous humor\", \"Tears\", \"Blood\"]','Aqueous humor fills the anterior chamber of the eye','Eye Structures',NULL,NULL),(57,'multiple_choice','hard','Hearing Mechanism',NULL,5,'Hair cells','[\"Rods\", \"Cones\", \"Hair cells\", \"Ganglion cells\"]','Mechanoreceptor hair cells in the organ of Corti transduce sound vibrations','Hearing Mechanism',NULL,NULL),(58,'multiple_choice','easy','Body Planes',NULL,NULL,'Sagittal plane','[\"Sagittal plane\", \"Transverse plane\", \"Frontal plane\", \"Coronal plane\"]','The sagittal plane divides the body into right and left portions. The midsagittal plane divides it into equal right and left halves.','Body Planes',NULL,NULL),(59,'multiple_choice','easy','Directional Terms',NULL,NULL,'Toward the front','[\"Toward the front\", \"Toward the back\", \"Toward the head\", \"Toward the feet\"]','Anterior means toward the front of the body. The opposite term is posterior.','Directional Terms',NULL,NULL),(60,'true_false','easy','Directional Terms',NULL,NULL,'false',NULL,'Superior means toward the head or upper part of a structure. Inferior means toward the feet.','Directional Terms',NULL,NULL),(61,'multiple_choice','medium','Test Quiz',1,NULL,'2','[\"1\", \"2\", \"3\", \"4\"]',NULL,'What is 1+1?',NULL,NULL),(62,'multiple_choice','medium','Test Quiz',1,NULL,'2','[\"1\", \"2\", \"3\", \"4\"]',NULL,'What is 1+1?',NULL,NULL);
/*!40000 ALTER TABLE `questionbank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz`
--

DROP TABLE IF EXISTS `quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz`
--

LOCK TABLES `quiz` WRITE;
/*!40000 ALTER TABLE `quiz` DISABLE KEYS */;
INSERT INTO `quiz` VALUES (57,'Practice: LAB 1: Anatomical Language',NULL,1,30,15,60.00,0,'2026-02-26 00:46:39'),(58,'Practice: LAB 1: Anatomical Language',NULL,1,30,15,60.00,0,'2026-02-26 00:46:39'),(59,'Practice: LAB 2: Bones and Bone Markings',NULL,2,30,15,60.00,0,'2026-02-26 00:56:10'),(60,'Practice: LAB 2: Bones and Bone Markings',NULL,2,30,15,60.00,0,'2026-02-26 00:56:10'),(61,'Practice: LAB 3: Spinal Cord and Spinal Nerves',NULL,3,30,15,60.00,0,'2026-02-26 01:02:35'),(63,'Test Quiz','Reproduction test',1,20,1,60.00,1,'2026-02-26 01:07:20'),(65,'Test Quiz','Reproduction test',1,20,1,60.00,1,'2026-02-26 01:12:31');
/*!40000 ALTER TABLE `quiz` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizattempt`
--

DROP TABLE IF EXISTS `quizattempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizattempt`
--

LOCK TABLES `quizattempt` WRITE;
/*!40000 ALTER TABLE `quizattempt` DISABLE KEYS */;
INSERT INTO `quizattempt` VALUES (67,57,1,'2026-02-26 00:53:30','2026-02-26 00:54:09','completed','2026-02-26 00:53:30','{\"correctAnswers\": 0, \"totalQuestions\": 4, \"incorrectAnswers\": 4, \"skippedQuestions\": 0, \"answeredQuestions\": 4, \"totalPointsEarned\": \"0.00\"}','2026-02-26 00:54:09',0.00),(68,57,1,'2026-02-26 00:53:30','2026-02-26 00:53:42','completed','2026-02-26 00:53:30','{\"correctAnswers\": 0, \"totalQuestions\": 4, \"incorrectAnswers\": 4, \"skippedQuestions\": 0, \"answeredQuestions\": 4, \"totalPointsEarned\": \"0.00\"}','2026-02-26 00:53:42',0.00),(69,59,1,'2026-02-26 00:56:10','2026-02-26 01:02:26','completed','2026-02-26 00:56:10','{\"correctAnswers\": 0, \"totalQuestions\": 2, \"incorrectAnswers\": 2, \"skippedQuestions\": 0, \"answeredQuestions\": 2, \"totalPointsEarned\": \"0.00\"}','2026-02-26 01:02:26',0.00),(70,60,1,'2026-02-26 00:56:10','2026-02-26 00:56:22','completed','2026-02-26 00:56:10','{\"correctAnswers\": 1, \"totalQuestions\": 2, \"incorrectAnswers\": 1, \"skippedQuestions\": 0, \"answeredQuestions\": 2, \"totalPointsEarned\": \"1.00\"}','2026-02-26 00:56:22',50.00),(71,61,1,'2026-02-26 01:02:35','2026-02-26 01:02:40','completed','2026-02-26 01:02:35','{\"correctAnswers\": 2, \"totalQuestions\": 2, \"incorrectAnswers\": 0, \"skippedQuestions\": 0, \"answeredQuestions\": 2, \"totalPointsEarned\": \"2.00\"}','2026-02-26 01:02:40',100.00),(72,65,1,'2026-02-26 09:49:30','2026-02-26 09:49:34','completed','2026-02-26 09:49:30','{\"correctAnswers\": 0, \"totalQuestions\": 1, \"incorrectAnswers\": 1, \"skippedQuestions\": 0, \"answeredQuestions\": 1, \"totalPointsEarned\": \"0.00\"}','2026-02-26 09:49:34',0.00),(73,63,1,'2026-03-01 15:02:01','2026-03-01 15:02:04','completed','2026-03-01 15:02:01','{\"correctAnswers\": 1, \"totalQuestions\": 1, \"incorrectAnswers\": 0, \"skippedQuestions\": 0, \"answeredQuestions\": 1, \"totalPointsEarned\": \"1.00\"}','2026-03-01 15:02:04',100.00),(74,65,1,'2026-03-01 15:13:07','2026-03-01 15:13:12','completed','2026-03-01 15:13:07','{\"correctAnswers\": 1, \"totalQuestions\": 1, \"incorrectAnswers\": 2, \"skippedQuestions\": 0, \"answeredQuestions\": 3, \"totalPointsEarned\": \"2.00\"}','2026-03-01 15:13:12',67.00),(75,65,1,'2026-03-01 15:18:19','2026-03-01 15:18:24','completed','2026-03-01 15:18:19','{\"correctAnswers\": 1, \"totalQuestions\": 1, \"incorrectAnswers\": 0, \"skippedQuestions\": 0, \"answeredQuestions\": 1, \"totalPointsEarned\": \"1.00\"}','2026-03-01 15:18:24',100.00),(76,65,1,'2026-03-01 15:25:50','2026-03-01 15:25:52','completed','2026-03-01 15:25:50','{\"correctAnswers\": 1, \"totalQuestions\": 1, \"incorrectAnswers\": 0, \"skippedQuestions\": 0, \"answeredQuestions\": 1, \"totalPointsEarned\": \"1.00\"}','2026-03-01 15:25:52',100.00),(77,65,1,'2026-03-01 15:33:22',NULL,'in_progress','2026-03-01 15:33:22',NULL,NULL,NULL);
/*!40000 ALTER TABLE `quizattempt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizquestion`
--

DROP TABLE IF EXISTS `quizquestion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizquestion`
--

LOCK TABLES `quizquestion` WRITE;
/*!40000 ALTER TABLE `quizquestion` DISABLE KEYS */;
INSERT INTO `quizquestion` VALUES (495,57,2,'The anatomical position has the palms facing forward.','medium',1.00,1,1,NULL),(496,57,1,'Which plane divides the body into left and right halves?','medium',1.00,1,1,NULL),(497,57,1,'Which plane divides the body into left and right halves?','medium',1.00,2,1,NULL),(498,57,2,'The anatomical position has the palms facing forward.','medium',1.00,2,1,NULL),(499,59,3,'Which bone is part of the axial skeleton?','medium',1.00,1,1,NULL),(500,60,3,'Which bone is part of the axial skeleton?','medium',1.00,1,1,NULL),(501,59,4,'The humerus is a bone in the arm.','medium',1.00,2,1,NULL),(502,60,4,'The humerus is a bone in the arm.','medium',1.00,2,1,NULL),(503,61,5,'How many cervical vertebrae are there?','medium',1.00,1,1,NULL),(504,61,6,'The spinal cord is part of the central nervous system.','medium',1.00,2,1,NULL),(505,63,61,'What is 1+1?','medium',1.00,1,1,NULL),(506,65,62,'What is 1+1?','medium',1.00,1,1,NULL);
/*!40000 ALTER TABLE `quizquestion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportrequest`
--

DROP TABLE IF EXISTS `reportrequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportrequest`
--

LOCK TABLES `reportrequest` WRITE;
/*!40000 ALTER TABLE `reportrequest` DISABLE KEYS */;
/*!40000 ALTER TABLE `reportrequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessionanalytics`
--

DROP TABLE IF EXISTS `sessionanalytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessionanalytics`
--

LOCK TABLES `sessionanalytics` WRITE;
/*!40000 ALTER TABLE `sessionanalytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessionanalytics` ENABLE KEYS */;
UNLOCK TABLES;



--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES (1,6,'22i-1239','2024-01-15',NULL,'A'),(2,7,'VRMTS2024002','2024-01-15',NULL,'B+'),(3,8,'VRMTS2024003','2024-02-01',NULL,'A-'),(4,9,'VRMTS2024004','2024-02-01',NULL,'B'),(5,10,'VRMTS2024005','2024-02-15',NULL,'A-');
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studentmoduleassignment`
--

DROP TABLE IF EXISTS `studentmoduleassignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studentmoduleassignment`
--

LOCK TABLES `studentmoduleassignment` WRITE;
/*!40000 ALTER TABLE `studentmoduleassignment` DISABLE KEYS */;
INSERT INTO `studentmoduleassignment` VALUES (1,1,1,5.00,95.00,100.00,'in_progress','2025-11-11 18:43:14','2025-12-10 14:58:24'),(2,1,2,8.00,92.00,100.00,'in_progress','2025-11-15 18:43:14','2026-02-26 09:56:31'),(3,1,3,7.50,88.00,100.00,'completed','2025-11-19 18:43:14','2025-11-16 18:43:14'),(4,1,4,9.00,90.00,100.00,'completed','2025-11-24 18:43:14','2025-11-20 18:43:14'),(5,1,5,6.50,85.00,95.00,'in_progress',NULL,'2025-12-09 20:09:43'),(6,1,6,0.00,0.00,0.00,'not_started',NULL,'2025-12-04 18:43:14'),(7,2,1,4.50,88.00,100.00,'completed','2025-11-12 18:43:14','2025-11-09 18:43:14'),(8,2,2,7.00,85.00,100.00,'completed','2025-11-17 18:43:14','2025-11-13 18:43:14'),(9,2,3,6.00,80.00,100.00,'completed','2025-11-21 18:43:14','2025-11-18 18:43:14'),(10,2,4,5.50,78.00,75.00,'in_progress',NULL,'2025-11-22 18:43:14'),(11,2,5,0.00,0.00,0.00,'not_started',NULL,'2025-11-29 18:43:14'),(12,3,1,5.50,82.00,100.00,'completed','2025-11-13 18:43:14','2025-11-09 18:43:14'),(13,3,2,6.50,79.00,100.00,'completed','2025-11-19 18:43:14','2025-11-14 18:43:14'),(14,3,3,5.00,75.00,80.00,'in_progress',NULL,'2025-11-20 18:43:14'),(15,3,4,0.00,0.00,0.00,'not_started',NULL,'2025-11-27 18:43:14'),(16,4,1,6.00,75.00,100.00,'completed','2025-11-15 18:43:14','2025-11-09 18:43:14'),(17,4,2,8.50,72.00,100.00,'completed','2025-11-21 18:43:14','2025-11-16 18:43:14'),(18,4,3,7.00,68.00,65.00,'in_progress',NULL,'2025-11-22 18:43:14'),(19,5,1,3.50,78.00,100.00,'completed','2025-11-27 18:43:14','2025-11-24 18:43:14'),(20,5,2,4.00,80.00,85.00,'in_progress',NULL,'2025-11-28 18:43:14');
/*!40000 ALTER TABLE `studentmoduleassignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemreport`
--

DROP TABLE IF EXISTS `systemreport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemreport`
--

LOCK TABLES `systemreport` WRITE;
/*!40000 ALTER TABLE `systemreport` DISABLE KEYS */;
/*!40000 ALTER TABLE `systemreport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher`
--

DROP TABLE IF EXISTS `teacher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher` (
  `teacherId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`teacherId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `teacher_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher`
--

LOCK TABLES `teacher` WRITE;
/*!40000 ALTER TABLE `teacher` DISABLE KEYS */;
INSERT INTO `teacher` VALUES (1,3,'Anatomy & Physiology'),(2,4,'Neuroscience'),(3,5,'Clinical Sciences');
/*!40000 ALTER TABLE `teacher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'ad1@vrmts.edu','1234','Dr. Sarah Mitchell','2025-12-09 18:37:37',NULL,'admin',1),(2,'ad2@vrmts.edu','1234','Prof. James Carter','2025-12-09 18:37:37',NULL,'admin',1),(3,'te1@vrmts.edu','1234','Dr. Emily Johnson','2025-12-09 18:37:37','2026-02-26 09:57:40','teacher',1),(4,'te2@vrmts.edu','1234','Dr. Michael Chen','2025-12-09 18:37:37',NULL,'teacher',1),(5,'te3@vrmts.edu','1234','Dr. Rachel Martinez','2025-12-09 18:37:37',NULL,'teacher',1),(6,'st1@vrmts.edu','1234','Alex Thompson','2025-12-09 18:37:37','2026-03-01 15:01:50','student',1),(7,'st2@vrmts.edu','1234','Maria Garcia','2025-12-09 18:37:37',NULL,'student',1),(8,'st3@vrmts.edu','1234','David Lee','2025-12-09 18:37:37',NULL,'student',1),(9,'st@vrmts.edu','1234','Sophie Williams','2025-12-09 18:37:37',NULL,'student',1),(10,'st5@vrmts.edu','1234','James Anderson','2025-12-09 18:37:37',NULL,'student',1);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `useraccessibility`
--

DROP TABLE IF EXISTS `useraccessibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `useraccessibility`
--

LOCK TABLES `useraccessibility` WRITE;
/*!40000 ALTER TABLE `useraccessibility` DISABLE KEYS */;
INSERT INTO `useraccessibility` VALUES (1,1,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(2,2,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(3,3,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(4,4,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(5,5,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(6,6,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(7,7,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(8,8,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(9,9,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01'),(10,10,16,0,0,0,1,0,'2025-12-09 18:39:01','2025-12-09 18:39:01');
/*!40000 ALTER TABLE `useraccessibility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usernotifications`
--

DROP TABLE IF EXISTS `usernotifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usernotifications`
--

LOCK TABLES `usernotifications` WRITE;
/*!40000 ALTER TABLE `usernotifications` DISABLE KEYS */;
INSERT INTO `usernotifications` VALUES (1,1,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(2,2,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(3,3,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(4,4,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(5,5,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(6,6,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(7,7,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(8,8,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(9,9,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01'),(10,10,1,1,1,0,'weekly','2025-12-09 18:39:01','2025-12-09 18:39:01');
/*!40000 ALTER TABLE `usernotifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userpreferences`
--

DROP TABLE IF EXISTS `userpreferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userpreferences`
--

LOCK TABLES `userpreferences` WRITE;
/*!40000 ALTER TABLE `userpreferences` DISABLE KEYS */;
INSERT INTO `userpreferences` VALUES (1,1,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(2,2,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(3,3,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(4,4,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(5,5,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(6,6,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(7,7,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(8,8,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(9,9,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54'),(10,10,'dark','en','UTC+05:00','MM/DD/YYYY','grid','2025-12-09 18:38:54','2025-12-09 18:38:54');
/*!40000 ALTER TABLE `userpreferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weaknessprofile`
--

DROP TABLE IF EXISTS `weaknessprofile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weaknessprofile` (
  `profileId` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `weakTopics` json DEFAULT NULL,
  `weakAreas` json DEFAULT NULL,
  `improvementPattern` json DEFAULT NULL,
  `lastUpdated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`profileId`),
  KEY `idx_studentId` (`studentId`),
  CONSTRAINT `weaknessprofile_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `student` (`studentId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weaknessprofile`
--

LOCK TABLES `weaknessprofile` WRITE;
/*!40000 ALTER TABLE `weaknessprofile` DISABLE KEYS */;
/*!40000 ALTER TABLE `weaknessprofile` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-01 16:17:04
