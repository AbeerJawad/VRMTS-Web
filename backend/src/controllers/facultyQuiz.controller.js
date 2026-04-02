const db = require('../config/db');
const RAG_BASE_URL = process.env.RAG_BASE_URL || 'http://127.0.0.1:8000';
const RAG_TIMEOUT_MS = Number(process.env.RAG_TIMEOUT_MS || 180000);

/**
 * Generate MCQs using RAG server and save to staging table
 */
const generateQuestions = async (req, res) => {
    let connection;
    try {
        const { labNum, count, difficulty, topicHint } = req.body;
        const teacherId = req.session.user.teacherId;

        if (!teacherId) {
            return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
        }

        console.log(`Generating MCQs for Lab ${labNum}, Count ${count}`);

        // 1. Call RAG server with timeout protection
        const controller = new AbortController();
        const timeoutMs = Number.isFinite(RAG_TIMEOUT_MS) && RAG_TIMEOUT_MS > 0 ? RAG_TIMEOUT_MS : 180000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        let ragResponse;
        try {
            ragResponse = await fetch(`${RAG_BASE_URL}/generate_mcqs_on_fly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lab_num: parseInt(labNum),
                    count: parseInt(count),
                    difficulty: difficulty || 'medium',
                    topic_hint: topicHint || ''
                }),
                signal: controller.signal
            });
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('RAG fetch failed or timed out:', err);
            if (err.name === 'AbortError') {
                return res.status(504).json({
                    success: false,
                    message: `AI generation timed out after ${Math.round(timeoutMs / 1000)}s via ${RAG_BASE_URL}. Try fewer questions, or increase RAG_TIMEOUT_MS.`
                });
            }
            return res.status(502).json({
                success: false,
                message: 'Failed to reach AI generation service',
                error: err.message
            });
        } finally {
            clearTimeout(timeoutId);
        }

        console.log(`RAG Server response status: ${ragResponse.status}`);
        if (!ragResponse.ok) {
            const errorText = await ragResponse.text();
            console.error(`RAG Server Error: ${errorText}`);
            return res.status(500).json({ 
                success: false, 
                message: `RAG server error (${ragResponse.status})`,
                error: errorText 
            });
        }

        const ragData = await ragResponse.json();

        if (ragData.success === false) {
            console.error(`RAG Generation Failed: ${ragData.error}`);
            return res.status(500).json({ 
                success: false, 
                message: ragData.error || 'RAG server failed to generate questions',
                error: ragData.error 
            });
        }

        const generatedQuestions = ragData.questions;

        // 2. Save to staging table
        connection = await db();
        
        const insertPromises = generatedQuestions.map(q => {
            return connection.execute(
                `INSERT INTO ai_question_staging 
                (instructorId, labNum, questionText, options, correctIndex, explanation, difficulty, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    teacherId,
                    labNum,
                    q.question,
                    JSON.stringify(q.options),
                    q.correctIndex,
                    `${q.explanation}\n\nCitation: ${q.source || 'Lab Manual'}`,
                    q.difficulty || difficulty || 'medium'
                ]
            );
        });

        const results = await Promise.all(insertPromises);
        
        // Add stagingId to each question for the frontend
        const questionsWithIds = generatedQuestions.map((q, index) => ({
            ...q,
            stagingId: results[index][0].insertId,
            status: 'pending'
        }));

        await connection.end();

        res.json({
            success: true,
            message: `Generated ${questionsWithIds.length} questions`,
            data: questionsWithIds
        });

    } catch (error) {
        console.error('Error generating questions:', error);
        if (connection) await connection.end().catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to generate questions', error: error.message });
    }
};

/**
 * Get all pending questions for the current instructor
 */
const getStagingQuestions = async (req, res) => {
    let connection;
    try {
        const teacherId = req.session.user.teacherId;
        const { labNum } = req.query;

        connection = await db();
        let query = 'SELECT * FROM ai_question_staging WHERE instructorId = ? AND status = "pending"';
        let params = [teacherId];

        if (labNum) {
            query += ' AND labNum = ?';
            params.push(labNum);
        }

        const [rows] = await connection.execute(query, params);
        await connection.end();

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching staging questions:', error);
        if (connection) await connection.end().catch(() => {});
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update a specific staging question (edit during review)
 */
const updateStagingQuestion = async (req, res) => {
    let connection;
    try {
        const { stagingId } = req.params;
        const { questionText, options, correctIndex, explanation, difficulty, status } = req.body;
        const teacherId = req.session.user.teacherId;

        connection = await db();
        
        // Verify ownership
        const [check] = await connection.execute(
            'SELECT stagingId FROM ai_question_staging WHERE stagingId = ? AND instructorId = ?',
            [stagingId, teacherId]
        );

        if (check.length === 0) {
            await connection.end();
            return res.status(403).json({ success: false, message: 'Unauthorized or question not found' });
        }

        const updateFields = [];
        const params = [];

        if (questionText !== undefined) { updateFields.push('questionText = ?'); params.push(questionText); }
        if (options !== undefined) { updateFields.push('options = ?'); params.push(JSON.stringify(options)); }
        if (correctIndex !== undefined) { updateFields.push('correctIndex = ?'); params.push(correctIndex); }
        if (explanation !== undefined) { updateFields.push('explanation = ?'); params.push(explanation); }
        if (difficulty !== undefined) { updateFields.push('difficulty = ?'); params.push(difficulty); }
        if (status !== undefined) { updateFields.push('status = ?'); params.push(status); }

        if (updateFields.length === 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        params.push(stagingId);
        await connection.execute(
            `UPDATE ai_question_staging SET ${updateFields.join(', ')} WHERE stagingId = ?`,
            params
        );

        await connection.end();
        res.json({ success: true, message: 'Question updated successfully' });

    } catch (error) {
        console.error('Error updating staging question:', error);
        if (connection) await connection.end().catch(() => {});
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Bulk approve questions and move them to QuestionBank
 */
const approveQuestions = async (req, res) => {
    let connection;
    try {
        const { stagingIds, moduleId } = req.body; // moduleId is required to link to a module
        const teacherId = req.session.user.teacherId;

        if (!stagingIds || !Array.isArray(stagingIds) || stagingIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No questions provided for approval' });
        }

        connection = await db();

        // 1. Fetch the questions from staging
        const [questions] = await connection.execute(
            `SELECT * FROM ai_question_staging WHERE stagingId IN (${stagingIds.map(() => '?').join(',')}) AND instructorId = ?`,
            [...stagingIds, teacherId]
        );

        if (questions.length === 0) {
            await connection.end();
            return res.status(404).json({ success: false, message: 'No valid questions found for the given IDs' });
        }

        // 2. Move to QuestionBank
        const insertedBankIds = [];
        for (const q of questions) {
            const [result] = await connection.execute(
                `INSERT INTO QuestionBank 
                (moduleId, questionText, options, correctAnswer, explanation, getByDifficultyLevel) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    moduleId,
                    q.questionText,
                    q.options, // Already a JSON string in DB
                    JSON.parse(q.options)[q.correctIndex], // Get the actual text of back-end
                    q.explanation,
                    q.difficulty
                ]
            );
            insertedBankIds.push({
                stagingId: q.stagingId,
                bankId: result.insertId,
                questionText: q.questionText,
                options: JSON.parse(q.options),
                correctAnswer: JSON.parse(q.options)[q.correctIndex],
                explanation: q.explanation,
                difficulty: q.difficulty
            });
        }

        // 3. Delete or update status in staging
        await connection.execute(
            `UPDATE ai_question_staging SET status = 'approved' WHERE stagingId IN (${stagingIds.map(() => '?').join(',')})`,
            stagingIds
        );

        await connection.end();

        res.json({
            success: true,
            message: `Successfully approved and moved ${insertedBankIds.length} questions to QuestionBank`,
            data: insertedBankIds
        });

    } catch (error) {
        console.error('Error approving questions:', error);
        if (connection) await connection.end().catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to approve questions', error: error.message });
    }
};

module.exports = {
    generateQuestions,
    getStagingQuestions,
    updateStagingQuestion,
    approveQuestions
};
