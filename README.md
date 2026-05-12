# VR Medical Training System (VRMTS)

A comprehensive Virtual Reality Medical Training System for anatomy education with interactive 3D models, module-based learning, and quiz assessment capabilities.

## Table of Contents
- [Frontend Screens](#frontend-screens)
- [Backend APIs](#backend-apis)
- [Quiz System Implementation](#quiz-system-implementation)
- [3D Model Viewing](#3d-model-viewing-progress)
- [Setup Instructions](#setup-instructions)
- [Backend deployment](#backend-deployment)

## Backend deployment

Step-by-step backend hosting (e.g. Railway), MySQL wiring, CORS/cookies, and a **full environment variable reference**, are in **`backend/DEPLOYMENT.md`**. For local API work, copy `backend/.env.example` to `backend/.env` and fill in values.

## Frontend Screens

### Common Screens
- **Landing** (`/`) - Welcome page
- **Login** (`/login`) - User authentication
- **TestModelPage** (`/testmodel`) - 3D model testing page

### Student Screens
- **StudentDashboard** (`/studentdashboard`) - Student main dashboard
- **StudentSettings** (`/settings`) - Student settings and preferences
- **StudentAnalytics** (`/studentanalytics`) - Student performance analytics
- **ModulesList** (`/modules`) - List of available modules
- **ModuleExploration** (`/module/:id`) - Interactive module exploration
- **QuizSelection** (`/quizselection`) - Quiz selection interface
- **QuizTaking** (`/quizattempt/:attemptId`) - Quiz taking interface
- **QuizResult** (`/quizresult/:attemptId`) - Quiz results display

### Instructor Screens
- **InstructorDashboard** (`/instructordashboard`) - Instructor main dashboard
- **InstructorManageStudents** (`/instructor/students`) - Instructor student management
- **InstructorSettings** (`/instructorsettings`) - Instructor settings and preferences

### Admin Screens
- **AdminOverview** (`/admindashboard`) - System health and resource monitoring
- **AdminStudents** (`/admin/students`) - Student directory and bulk upload management
- **AdminFaculty** (`/admin/faculty`) - Faculty directory and account creation
- **AdminAnnouncements** (`/admin/announcements`) - Global announcement dispatch system
- **AdminAuditLogs** (`/admin/audit`) - System-wide administrative audit registry

### Additional Pages (Not Routed)
- AssignModule - Module assignment interface
- ThreeViewer - 3D model viewer

## Backend APIs

The following API endpoints are implemented in the backend:

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /check` - Check authentication status

### Modules (`/api/modules`)
- `GET /` - Get available modules
- `GET /stats` - Get module statistics
- `POST /:moduleId/start` - Start a module

### Dashboard (`/api/dashboard`)
- `GET /stats` - Get dashboard statistics
- `GET /recent-modules` - Get recent modules
- `GET /recent-activity` - Get recent activity
- `GET /upcoming-deadlines` - Get upcoming deadlines

### User Management (`/api/user`)
- `GET /settings` - Get user settings
- `PUT /account` - Update account info
- `PUT /preferences` - Update preferences
- `PUT /accessibility` - Update accessibility settings
- `PUT /notifications` - Update notification settings
- `PUT /password` - Change password

### Quiz (`/api/quiz`)
- `GET /modules` - Get available modules for quiz selection
- `GET /stats` - Get quiz statistics (quizzes taken, average score, pass rate, total time)
- `GET /attempts` - Get previous quiz attempts with scores and status
- `POST /module/:moduleId/start` - Start a module quiz (10 random questions, 15 min time limit)
- `POST /timed-exam/start` - Start a timed exam (custom time limit, 20 questions)
- `POST /adaptive/start` - Start an adaptive test (18 questions, 45 min, difficulty-based)
- `POST /submit-answer` - Submit an answer for a question (alternative route)
- `POST /attempt/:attemptId/answer` - Submit an answer for a specific question
- `GET /attempt/:attemptId/progress` - Get quiz progress (answered questions, points earned, time spent)
- `POST /attempt/:attemptId/finish` - Finish quiz attempt and calculate final score
- `GET /attempt/:attemptId` - Get quiz attempt details with questions and results

### Module Exploration (`/api/explore`)
- `GET /:moduleId/details` - Get module details
- `GET /:moduleId/bookmarks` - Get bookmarks
- `POST /:moduleId/bookmarks` - Save bookmark
- `GET /:moduleId/notes` - Get notes
- `POST /:moduleId/notes` - Save notes
- `POST /:moduleId/interactions` - Log interaction
- `POST /:moduleId/chat` - AI chat interaction
- `GET /:moduleId/progress` - Get progress
- `PUT /:moduleId/progress` - Update progress

### Analytics (`/api/analytics`)
- `GET /student` - Get detailed student analytics (overview, score progress, study time, module performance, question type performance, recent activity, strengths, weaknesses, learning patterns, achievements)

### Administration (`/api/admin`)
- `GET /stats` - Get real-time system stats and metrics
- `GET /students` - List all students with teacher and class info
- `GET /teachers` - List all active faculty members
- `POST /faculty` - Create new faculty account
- `POST /bulk-upload` - Process bulk student CSV data
- `POST /update-status` - Toggle user active status
- `POST /assign-teacher` - Assign teacher and class to student
- `POST /announce` - Send global system announcement
- `GET /logs` - Fetch administrative audit logs

### Test
- `GET /api/test` - API test endpoint

## Quiz System Implementation

The quiz system is fully implemented and functional. Here's how it works:

### Quiz Creation Flow
1. **Module Quiz**: Student selects a module → System randomly selects 10 questions from QuestionBank → Creates Quiz and QuizQuestion records → Creates QuizAttempt with "in_progress" status
2. **Timed Exam**: Student selects modules and time limit → System randomly selects questions → Creates custom quiz
3. **Adaptive Test**: Student selects difficulty → System selects questions based on difficulty level

### Quiz Taking Flow
1. Student navigates to quiz taking page with `attemptId`
2. System fetches quiz questions from `QuizQuestion` table
3. Student answers questions → Each answer is saved to `AnswerRecord` table via `/api/quiz/submit-answer`
4. Timer counts down (15 minutes for module quiz)
5. Student clicks "Submit Quiz" → Calls `/api/quiz/attempt/:attemptId/finish`

### Scoring System
1. **Answer Validation**: Each answer is compared to `correctAnswer` in `QuestionBank` (case-insensitive)
2. **Points Calculation**: Correct answers earn points (default 1 point per question)
3. **Final Score**: Calculated as `(totalPointsEarned / totalPossiblePoints) * 100`
4. **Pass/Fail**: Determined by comparing score to `passingScore` (default 60%)
5. **Results Include**:
   - Final score percentage
   - Correct/incorrect/skipped question counts
   - Time spent
   - Question breakdown by type (MCQ, Labeling, Drag & Drop)
   - Detailed question review with explanations

### Database Schema Notes
- **QuestionBank**: Stores all available questions (no `moduleId` or `questionText` columns in current schema)
- **Quiz**: Stores quiz instances (basic schema: `moduleId`, `timeLimit`, `totalQuestions`, `passingScore`)
- **QuizQuestion**: Links questions to quizzes, stores `questionText` (retrieved from existing records or generated)
- **QuizAttempt**: Tracks student attempts with status (`in_progress`, `completed`, `abandoned`)
- **AnswerRecord**: Stores individual answers with correctness and points earned

### Key Features
- ✅ Random question selection from QuestionBank
- ✅ Real-time answer submission
- ✅ Automatic timer with auto-submit
- ✅ Score calculation and pass/fail determination
- ✅ Detailed results with question-by-question breakdown
- ✅ Question text retrieval from existing QuizQuestion records
- ✅ Support for multiple question types (MCQ, Labeling, Drag & Drop)

## Next Targets: Frontend-Backend Integration

The following frontend pages need to be connected to backend APIs (currently using mock data or not fetching from backend):

### Student Screens
- **StudentDashboard** - Connect to `/api/dashboard` endpoints for stats, recent modules, activity, and deadlines
- **StudentAnalytics** - Connect to `/api/analytics/student` for detailed analytics data
- **ModulesList** - Connect to `/api/modules` for available modules and stats
- **ModuleExploration** - Connect to `/api/explore/:moduleId` endpoints for details, bookmarks, notes, interactions, chat, and progress
- **QuizSelection** - ✅ **FULLY INTEGRATED** - Connected to `/api/quiz/modules`, `/api/quiz/stats`, and `/api/quiz/attempts`
- **QuizTaking** - ✅ **FULLY INTEGRATED** - Connected to `/api/quiz/attempt/:attemptId` for questions, `/api/quiz/submit-answer` for answers, and `/api/quiz/attempt/:attemptId/finish` for submission
- **QuizResult** - ✅ **FULLY INTEGRATED** - Connected to `/api/quiz/attempt/:attemptId` for detailed results with scores and question breakdown

### Instructor Screens
- **InstructorDashboard** - Connect to `/api/dashboard` endpoints 
- **InstructorManageStudents** - Connect to `/api/user` endpoints for student management (may require additional instructor-specific APIs)

### Admin Screens
- **AdminDashboard** - Connect to `/api/dashboard` endpoints (may require admin-specific data and additional admin APIs)

### Additional Pages (Not Routed)
- **AssignModule** - Implement backend connection for module assignment functionality (likely requires new API endpoints)

## 3D Model Viewing Progress

The 3D model viewing functionality has been implemented with the following features:

### ThreeViewer Component (`frontend/src/pages/ThreeViewer.tsx`)
- **3D Rendering**: Uses Three.js library for WebGL-based 3D rendering
- **Model Loading**: Supports FBX format models (e.g., SkeletalSystem100.fbx in `frontend/public/models/`)
- **Interactive Controls**:
  - Mouse drag to rotate the model
  - Mouse wheel to zoom in/out (with bounds: 50-800 units)
  - Click on model parts to select/highlight them
  - Hover over parts to display part names in a tooltip
- **Loading & Error Handling**:
  - Loading progress indicator with percentage
  - Error display for failed model loads
- **Performance Optimizations**:
  - Script loading caching to avoid redundant downloads
  - Pixel ratio limiting for better performance
  - Memory cleanup for geometries, materials, and renderer

### Test Page (`frontend/src/pages/testmodel.tsx`)
- Dedicated page for testing 3D model viewing functionality
- Integrates the ThreeViewer component with sample model path

### Current Status
- Basic 3D model loading and rendering
- Interactive rotation and zooming
- Part selection and highlighting
- Hover tooltips for part names

### Next Steps
- Add camera presets or viewpoints
- More interactivity
- Connect to backend for dynamic model loading based on modules
- Expanding and manipulating using physics


### Quiz System Notes
- Questions are stored in the `QuestionBank` table
- When creating quizzes, the system randomly selects questions
- Question text is retrieved from existing `QuizQuestion` records if available
- If no existing question text is found, it generates a placeholder based on the topic
- All quiz attempts are tracked in `QuizAttempt` with status and scores
- Answers are stored in `AnswerRecord` with correctness validation
