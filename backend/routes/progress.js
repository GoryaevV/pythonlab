// backend/routes/progress.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// Получить общий прогресс пользователя
router.get('/user/:userId', async (req, res) => {
    try {
        const progress = await db.query(`
            SELECT 
                COUNT(*) as total_modules,
                SUM(CASE WHEN ump.status = 'completed' THEN 1 ELSE 0 END) as completed_modules,
                SUM(CASE WHEN ump.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_modules,
                AVG(ump.progress) as avg_progress,
                SUM(ump.completed_exercises) as total_completed_exercises,
                (SELECT COUNT(*) FROM exercises) as total_exercises
            FROM user_module_progress ump
            WHERE ump.user_id = ?
        `, [req.params.userId]);
        
        // Получаем данные по каждому модулю для графика
        const modulesProgress = await db.query(`
            SELECT m.id, m.title, ump.progress, ump.status, ump.completed_at
            FROM modules m
            LEFT JOIN user_module_progress ump ON m.id = ump.module_id AND ump.user_id = ?
            ORDER BY m.order_index
        `, [req.params.userId]);
        
        res.json({
            summary: progress[0],
            modules: modulesProgress
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Обновить прогресс модуля
router.put('/module/:moduleId', async (req, res) => {
    try {
        const { user_id, progress, status, completed_exercises } = req.body;
        
        const result = await db.run(
            `UPDATE user_module_progress 
             SET progress = ?, status = ?, completed_exercises = ?,
                 ${status === 'completed' ? 'completed_at = CURRENT_TIMESTAMP' : ''}
                 ${status === 'in-progress' && progress > 0 ? 'started_at = COALESCE(started_at, CURRENT_TIMESTAMP)' : ''}
             WHERE user_id = ? AND module_id = ?`,
            [progress, status, completed_exercises, user_id, req.params.moduleId]
        );
        
        if (result.changes === 0) {
            // Если записи нет, создаем новую
            await db.run(
                `INSERT INTO user_module_progress (user_id, module_id, progress, status, completed_exercises, started_at)
                 VALUES (?, ?, ?, ?, ?, ${status !== 'not-started' ? 'CURRENT_TIMESTAMP' : 'NULL'})`,
                [user_id, req.params.moduleId, progress, status, completed_exercises]
            );
        }
        
        res.json({ message: 'Прогресс обновлен' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;