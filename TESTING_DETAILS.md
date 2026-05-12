# Testing Details

## Overview

Once the system has been successfully developed, testing has to be performed to ensure that the system is working as intended. This is also to check that the system meets the requirements stated earlier. Besides that, system testing will help in finding the errors that may be hidden from the user. The testing must be completed before it is deployed for use.

---

## Testing Strategy

Unit Testing

Unit testing is a critical phase in the software development process that involves testing individual components or modules of the system in isolation to ensure that each part functions correctly. The primary goal of unit testing is to validate that each unit of the software performs as designed and meets its specifications. Each unit test is designed to test a specific function or method independently from other components, helping to identify issues directly related to the functionality being tested. Unit tests are often automated, allowing for quick execution and repeatability, which enables frequent running, especially during integration or regression testing, to catch bugs early in the development lifecycle. A well-structured unit testing suite aims to achieve high test coverage, meaning that a significant portion of the codebase is tested, including positive test cases as well as edge cases and error conditions. Furthermore, unit testing provides immediate feedback to developers regarding the quality and reliability of their code, building confidence that changes made during development do not introduce new defects. Additionally, unit tests serve as a form of documentation for the codebase, illustrating how individual units are expected to behave, which makes it easier for new developers to understand the system. Overall, unit testing is an essential practice that contributes to software quality, reliability, and maintainability, ultimately reducing development costs and enhancing the end-user experience.

### Testing Tools

| Tool | Version | Purpose |
|---|---|---|
| **Mocha** | v10.2.0 | Unit and integration test framework for backend |
| **Chai** | v4.3.10 | Assertion library for test validations |
| **Chai HTTP** | v4.4.0 | HTTP request assertions for API testing |
| **Sinon** | v17.0.1 | Mocking, stubbing, and spying for isolated tests |
| **Vitest** | v4.1.4 | Unit testing framework for frontend |
| **NYC** | v15.1.0 | Code coverage reporting |
| **Vitest Coverage** | v4.1.4 | Frontend code coverage analysis |

---

## Backend API Testing

### Unit Tests

Unit tests validate individual functions and modules in isolation.

**Test Categories:**

#### 1. Authentication & User Management
- **Login validation** - Verify credential checking and session creation
- **Password hashing** - Bcryptjs hash/compare functions
- **Token generation** - Session token creation and validation
- **Role-based access control** - Student vs. Faculty vs. Admin permissions

**Example Test Cases:**
```
✓ Should hash password with salt
✓ Should verify correct password
✓ Should reject incorrect password
✓ Should create session for valid user
✓ Should deny access to unauthorized roles
```

#### 2. Quiz Delivery Algorithm Tests
- **Dynamic quiz generation** - Random question selection logic
- **Session metadata storage** - Storing selected question IDs
- **Question shuffling** - Verify randomization algorithm
- **Attempt creation** - Quiz attempt record generation

**Example Test Cases:**
```
✓ Should select correct number of random questions
✓ Should not duplicate questions in same session
✓ Should create quiz attempt with valid metadata
✓ Should handle empty question bank gracefully
✓ Should respect question count limits
```

#### 3. Quiz Scoring Algorithm Tests
- **Score calculation** - Points earned vs. total possible
- **Pass/fail determination** - Against passing threshold
- **Question breakdown** - MCQ vs. labeling vs. drag-drop stats
- **Edge cases** - Zero points, all correct, all skipped

**Example Test Cases:**
```
✓ Should calculate score as percentage correctly
✓ Should mark as passed when score >= threshold
✓ Should mark as failed when score < threshold
✓ Should handle skipped questions (0 points)
✓ Should generate correct question breakdown
✓ Should handle division by zero (no questions)
```

#### 4. Data Persistence Tests
- **Database writes** - Inserting quiz attempts, answers, analytics
- **Data retrieval** - Querying user data, quiz history
- **Transaction integrity** - Atomic operations
- **Connection pooling** - MySQL connection management

**Example Test Cases:**
```
✓ Should insert quiz attempt into database
✓ Should store all answer records
✓ Should retrieve quiz history for student
✓ Should rollback on transaction failure
✓ Should maintain connection pool
```

### Integration Tests

Integration tests verify interactions between multiple components.

#### 1. Quiz Workflow Integration
- **Load module → Select quiz → Take quiz → Submit → View results**
- Validates data flow from question bank through scoring to results display
- Tests session state persistence
- Verifies analytics data recording

**Test Scenario:**
```
1. Login as student
2. Select module (e.g., Lab1)
3. Start practice quiz
4. Verify random questions loaded
5. Submit answers
6. Verify score calculated correctly
7. Verify results stored in database
8. Verify analytics updated
```

#### 2. User Management Integration
- **Register → Login → Access dashboard → Logout**
- Tests authentication flow with session management
- Verifies role-based dashboard access (student vs. faculty vs. admin)
- Tests session expiration

**Test Scenario:**
```
1. Register new user with email/password
2. Verify user created in database
3. Login with credentials
4. Verify session created
5. Access restricted pages (should allow)
6. Logout
7. Verify session cleared
8. Attempt access without session (should deny)
```

#### 3. Faculty Quiz Creation Integration
- **Create quiz → Add questions → Set difficulty → Assign to students → Students take quiz**
- Tests quiz builder with database persistence
- Validates question storage and retrieval
- Verifies assignment distribution

**Test Scenario:**
```
1. Faculty creates new quiz
2. Faculty adds 10 questions
3. Faculty sets difficulty level
4. Faculty assigns to class
5. Verify quiz appears in student module list
6. Student takes quiz
7. Verify quiz attempt recorded
8. Verify score calculated and stored
```

#### 4. Analytics Data Collection Integration
- **Multiple quiz attempts → Aggregate analytics → Display insights**
- Tests data collection from quiz attempts
- Verifies aggregation calculations (averages, totals)
- Validates analytics display accuracy

**Test Scenario:**
```
1. Student completes 5 quiz attempts
2. System calculates average score
3. System identifies strength topics (>85%)
4. System identifies weakness topics (<75%)
5. Verify analytics dashboard shows correct values
```

---

## Frontend Three.js Testing

### Unit Tests (Vitest)

#### 1. Scene Initialization Tests
```javascript
✓ Should create THREE.Scene successfully
✓ Should set background color correctly
✓ Should create PerspectiveCamera with correct FOV
✓ Should initialize WebGLRenderer with antialiasing
✓ Should position camera at correct distance
✓ Should add ambient and directional lights
```

#### 2. FBX Model Loading Tests
```javascript
✓ Should load FBX file from path
✓ Should handle missing file gracefully
✓ Should calculate bounding box correctly
✓ Should center model at origin
✓ Should auto-scale oversized models
✓ Should traverse all meshes in model
```

#### 3. Raycasting & Selection Tests
```javascript
✓ Should convert screen coordinates to NDC correctly
✓ Should create ray from camera through point
✓ Should detect mesh intersection on hover
✓ Should highlight hovered mesh
✓ Should clear previous highlight
✓ Should restore original material on unhover
✓ Should handle multiple intersections (return first)
```

#### 4. Model Transformation Tests
```javascript
✓ Should apply explosion offset to meshes
✓ Should reset meshes to original positions
✓ Should handle zero-direction meshes with Fibonacci distribution
✓ Should scale explosion value correctly
✓ Should preserve original positions
```

#### 5. Clipping Planes Tests
```javascript
✓ Should create sagittal plane correctly
✓ Should create coronal plane correctly
✓ Should create transverse plane correctly
✓ Should apply planes to materials
✓ Should enable GPU clipping on renderer
✓ Should disable clipping when not needed
```

#### 6. Camera Controls Tests
```javascript
✓ Should update zoom on mouse wheel up/down
✓ Should constrain zoom between min/max values
✓ Should update camera aspect ratio on resize
✓ Should recalculate projection matrix
✓ Should resize renderer on window change
```

### Integration Tests

#### 1. Complete 3D Visualization Flow
```
1. Initialize scene with camera and renderer
2. Load FBX model
3. Apply materials and textures
4. Move mouse over scene
5. Verify mesh highlighting works
6. Click on mesh
7. Verify selection feedback
8. Rotate scene with mouse drag
9. Verify smooth rotation
10. Use mouse wheel to zoom
11. Verify camera position updates
12. Toggle clipping planes
13. Verify cross-sections display
14. Apply explosion effect
15. Verify meshes separate correctly
16. Reset explosion
17. Verify meshes return to original positions
```

#### 2. Model Loading & Interaction Flow
```
1. Load Lab1 anatomy model (FBX)
2. Verify all meshes loaded
3. Hover over different anatomical parts
4. Verify each part highlights correctly
5. Display part information on hover
6. Click part to isolate view
7. Verify camera focuses on part
8. Reset to full model view
9. Rotate model 360 degrees
10. Verify smooth interaction throughout
```

#### 3. Performance Stress Test
```
1. Load large anatomical model (500+ meshes)
2. Measure frame rate (should maintain 60 FPS)
3. Perform rapid mouse movements
4. Verify no lag or stuttering
5. Toggle multiple clipping planes
6. Verify no performance degradation
7. Apply explosion effect
8. Measure GPU usage (should be reasonable)
9. Reset and verify memory cleanup
```

---

## End-to-End Tests

### Student Learning Workflow
```
1. Student logs in to dashboard
2. Student selects module (e.g., Lab1 - Anatomy)
3. System displays 3D anatomical model
4. Student explores model with mouse (rotate, zoom, hover)
5. Student reviews interactive information for parts
6. Student navigates to quiz section
7. Student starts practice quiz with random questions
8. Quiz displays randomly selected questions
9. Student answers 10 questions
10. Student submits quiz
11. System calculates and displays score
12. Student reviews performance breakdown by question type
13. System updates analytics
14. Student returns to dashboard and views updated stats
15. Dashboard shows progress and areas for improvement
```

### Faculty Management Workflow
```
1. Faculty logs in to instructor dashboard
2. Faculty views class statistics (avg performance, completion rate)
3. Faculty creates new quiz with 15 questions
4. Faculty sets difficulty levels (easy/medium/hard)
5. Faculty assigns quiz to class
6. Faculty views student submissions as they come in
7. Faculty reviews quiz results and analytics
8. Faculty identifies at-risk students
9. Faculty creates targeted intervention quiz
10. Faculty monitors student progress over time
```

---

## Test Coverage Requirements

| Component | Target Coverage | Status |
|---|---|---|
| **Authentication** | ≥ 90% | Unit & Integration Tests |
| **Quiz Algorithms** | ≥ 85% | Unit & Integration Tests |
| **Scoring Logic** | ≥ 95% | Unit Tests (critical path) |
| **API Endpoints** | ≥ 80% | Integration Tests |
| **Database Layer** | ≥ 75% | Integration Tests |
| **Three.js Scene Setup** | ≥ 80% | Unit & Integration Tests |
| **Raycasting Logic** | ≥ 85% | Unit Tests |
| **Material Management** | ≥ 70% | Unit Tests |
| **Camera Controls** | ≥ 75% | Unit Tests |
| **Overall Project** | ≥ 80% | Combined Coverage |

---

## Test Execution

### Running Backend Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# All tests
npm run test:all

# With coverage report
npm run test:coverage

# Watch mode (auto-rerun on file change)
npm run test:watch
```

### Running Frontend Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

---

## Test Data & Fixtures

### Sample Quiz Data
```json
{
  "quizId": "quiz_001",
  "moduleId": "lab1",
  "totalQuestions": 10,
  "passingScore": 70,
  "questions": [
    {
      "questionId": "q_001",
      "type": "mcq",
      "question": "What is the primary function of the hypothalamus?",
      "options": ["Temperature regulation", "Movement", "Speech"],
      "correctIndex": 0,
      "points": 1
    }
  ]
}
```

### Sample User Data
```json
{
  "userId": "student_001",
  "email": "student@example.com",
  "password": "$2b$10$...(hashed)",
  "role": "student",
  "createdAt": "2026-05-01T08:00:00Z"
}
```

### Sample 3D Model Data
```
FBX Files:
- Lab1_Anatomy.fbx (500 meshes)
- Lab2_Anatomy.fbx (450 meshes)
- Test_Simple.fbx (5 meshes for quick testing)
```

---

## Quality Metrics

### Code Coverage Goals
- **Statements**: ≥ 80%
- **Branches**: ≥ 75%
- **Functions**: ≥ 85%
- **Lines**: ≥ 80%

### Performance Benchmarks
- **Quiz submission response**: < 500ms
- **Score calculation**: < 100ms
- **Analytics query**: < 1000ms
- **3D model load**: < 2000ms
- **Frame rate (Three.js)**: ≥ 60 FPS

### Security Testing
- ✓ SQL injection protection (parameterized queries)
- ✓ XSS prevention (input sanitization)
- ✓ CSRF tokens on state-changing requests
- ✓ Password hashing (Bcryptjs with salt)
- ✓ Session security (HTTPOnly cookies)
- ✓ CORS properly configured

---

## Regression Testing

After each release, regression tests ensure:
1. Existing quiz functionality still works
2. Previous quiz attempts remain intact
3. Student analytics are preserved
4. 3D visualization performance unchanged
5. No authentication regressions
6. Database integrity maintained

---

## Deployment Testing Checklist

Before deploying to production:

- [ ] All unit tests passing (backend & frontend)
- [ ] All integration tests passing
- [ ] Code coverage ≥ 80%
- [ ] No security vulnerabilities (OWASP Top 10)
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] API documentation updated
- [ ] User documentation complete
- [ ] Backup and recovery procedures tested

---

## Conclusion

Comprehensive testing across unit, integration, and end-to-end levels ensures the VRMTS system meets requirements, performs reliably, and provides a secure learning experience. Automated testing with Mocha, Chai, and Vitest enables continuous validation, while manual end-to-end testing validates complete user workflows. Coverage targets and performance benchmarks maintain code quality throughout development.

---

**Document Version:** 1.0  
**Last Updated:** May 8, 2026  
**Project:** VRMTS - Virtual Reality Modular Training System - Web & Visualization Components
