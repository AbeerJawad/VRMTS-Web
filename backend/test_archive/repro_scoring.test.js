const chai = require('chai');
const chaiHttpImport = require('chai-http');
const chaiHttp = chaiHttpImport.default || chaiHttpImport;
const expect = chai.expect;
const connectDB = require('../src/config/db');

chai.use(chaiHttp);

describe('Scoring Bug Reproduction', () => {
    let app;
    let agent;
    let db;

    before(async () => {
        app = require('../src/server');
        agent = chai.request.agent(app);
        db = await connectDB();

        // Login as student
        await agent
            .post('/api/auth/login')
            .send({
                email: 'stud@test.com',
                password: 'stu123'
            });
    });

    after(async () => {
        if (db) await db.end();
        agent.close();
    });

    it('should calculate correct score even if an answer is submitted multiple times', async () => {
        // 1. Start a quiz
        const startRes = await agent.post('/api/quiz/module/1/start');
        expect(startRes).to.have.status(200);
        const { attemptId } = startRes.body.data;

        // 2. Get questions
        const getRes = await agent.get(`/api/quiz/attempt/${attemptId}`);
        const questions = getRes.body.data.questions;
        const firstQuestion = questions[0];

        // 3. Submit the SAME answer twice for the first question
        await agent.post('/api/quiz/submit-answer').send({
            attemptId,
            questionId: firstQuestion.id,
            answer: firstQuestion.correctAnswer,
            timeSpent: 10
        });

        await agent.post('/api/quiz/submit-answer').send({
            attemptId,
            questionId: firstQuestion.id,
            answer: firstQuestion.correctAnswer,
            timeSpent: 10
        });

        // 4. Submit correct answers for the rest (to keep it simple)
        for (let i = 1; i < questions.length; i++) {
            await agent.post('/api/quiz/submit-answer').send({
                attemptId,
                questionId: questions[i].id,
                answer: questions[i].correctAnswer,
                timeSpent: 10
            });
        }

        // 5. Finish quiz
        const finishRes = await agent.post(`/api/quiz/attempt/${attemptId}/finish`);
        expect(finishRes).to.have.status(200);

        const { score, totalQuestions, correctAnswers } = finishRes.body.data;

        console.log(`Score: ${score}%, Total Questions: ${totalQuestions}, Correct Answers: ${correctAnswers}`);

        // If the bug exists, the score might be incorrect (e.g. > 100% or < 100% depending on weights, 
        // but if all 1 point, and one is duplicated, totalPossible might be 11 for 10 questions)

        // In a perfect world with 10 questions of 1 point each:
        // totalPointsEarned = 10 (if only 1 record per question is counted in earned)
        // totalPossiblePoints = 11 (if 1 question is joined twice)
        // score = 10/11 = 91% (even though all were correct!)

        expect(score).to.equal(100, `Score should be 100% but was ${score}%`);
        expect(correctAnswers).to.equal(questions.length, `Correct answers should be ${questions.length} but was ${correctAnswers}`);
    });
});
