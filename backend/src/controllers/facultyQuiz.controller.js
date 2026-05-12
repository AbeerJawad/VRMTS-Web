const db = require('../config/db');
const RAG_BASE_URL = process.env.RAG_BASE_URL || 'http://127.0.0.1:8000';
const RAG_TIMEOUT_MS = Number(process.env.RAG_TIMEOUT_MS || 180000);

/**
 * Generate MCQs using RAG server and save to staging table
 */
const generateQuestions = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'AI question generation is disabled in this environment.'
    });
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
