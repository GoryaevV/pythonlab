const express = require('express');
const router = express.Router();
const db = require('../database');

// Получить упражнения модуля
router.get('/module/:moduleId', async (req, res) => {
    try {
        const userId = req.query.user_id || 1;
        const moduleId = req.params.moduleId;
        
        const exercises = await db.query(`
            SELECT e.*, 
                   uep.completed, uep.user_code, uep.attempts, uep.completed_at
            FROM exercises e
            LEFT JOIN user_exercise_progress uep ON e.id = uep.exercise_id AND uep.user_id = ?
            WHERE e.module_id = ?
            ORDER BY e.order_index
        `, [userId, moduleId]);
        
        res.json(exercises);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить упражнение по ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.query.user_id || 1;
        const exerciseId = req.params.id;
        
        const exercise = await db.get(`
            SELECT e.*, m.title as module_title,
                   uep.completed, uep.user_code, uep.attempts, uep.completed_at
            FROM exercises e
            JOIN modules m ON e.module_id = m.id
            LEFT JOIN user_exercise_progress uep ON e.id = uep.exercise_id AND uep.user_id = ?
            WHERE e.id = ?
        `, [userId, exerciseId]);
        
        if (!exercise) {
            return res.status(404).json({ error: 'Упражнение не найдено' });
        }
        
        res.json(exercise);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Отправить решение упражнения
router.post('/:id/submit', async (req, res) => {
    try {
        const { user_id = 1, code } = req.body;
        const exerciseId = req.params.id;
        
        // Получаем информацию об упражнении
        const exercise = await db.get(
            'SELECT * FROM exercises WHERE id = ?',
            [exerciseId]
        );
        
        if (!exercise) {
            return res.status(404).json({ error: 'Упражнение не найдено' });
        }
        
        // Проверяем существующую запись
        const existing = await db.get(
            'SELECT * FROM user_exercise_progress WHERE user_id = ? AND exercise_id = ?',
            [user_id, exerciseId]
        );
        
        let result;
        if (existing) {
            // Обновляем существующую запись
            result = await db.run(
                `UPDATE user_exercise_progress 
                 SET completed = 1, 
                     user_code = ?, 
                     attempts = attempts + 1,
                     completed_at = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND exercise_id = ?`,
                [code, user_id, exerciseId]
            );
        } else {
            // Создаем новую запись
            result = await db.run(
                `INSERT INTO user_exercise_progress (user_id, exercise_id, completed, user_code, attempts, completed_at)
                 VALUES (?, ?, 1, ?, 1, CURRENT_TIMESTAMP)`,
                [user_id, exerciseId, code]
            );
        }
        
        // Обновляем прогресс модуля
        await updateModuleProgress(user_id, exercise.module_id);
        
        res.json({ 
            success: true, 
            message: 'Решение отправлено',
            completed: true,
            attempts: existing ? existing.attempts + 1 : 1
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Проверить решение (симуляция проверки кода)
router.post('/:id/check', async (req, res) => {
    try {
        const { code } = req.body;
        const exerciseId = req.params.id;
        
        // В реальной системе здесь был бы запуск Python кода
        // Пока что симулируем проверку
        
        const exercise = await db.get(
            'SELECT * FROM exercises WHERE id = ?',
            [exerciseId]
        );
        
        if (!exercise) {
            return res.status(404).json({ error: 'Упражнение не найдено' });
        }
        
        // Простая проверка: если код содержит print, считаем его рабочим
        const isValid = code && code.includes('print');
        
        res.json({
            success: true,
            isValid: isValid,
            message: isValid ? 'Код корректный' : 'Код требует доработки',
            hints: isValid ? [] : ['Добавьте вывод результатов с помощью print()']
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Обновить прогресс модуля
async function updateModuleProgress(userId, moduleId) {
    try {
        // Считаем выполненные упражнения модуля
        const completedResult = await db.get(`
            SELECT COUNT(*) as count
            FROM user_exercise_progress uep
            JOIN exercises e ON uep.exercise_id = e.id
            WHERE uep.user_id = ? AND uep.completed = 1 AND e.module_id = ?
        `, [userId, moduleId]);
        
        // Общее количество упражнений в модуле
        const totalResult = await db.get(
            'SELECT COUNT(*) as count FROM exercises WHERE module_id = ?',
            [moduleId]
        );
        
        const completedExercises = completedResult.count;
        const totalExercises = totalResult.count;
        const progress = Math.round((completedExercises / totalExercises) * 100);
        const status = progress === 100 ? 'completed' : 
                      progress > 0 ? 'in-progress' : 'not-started';
        
        // Обновляем прогресс модуля
        await db.run(
            `UPDATE user_module_progress 
             SET status = ?, 
                 progress = ?, 
                 completed_exercises = ?,
                 ${status === 'completed' ? 'completed_at = CURRENT_TIMESTAMP,' : ''}
                 ${status === 'in-progress' && progress > 0 ? 'started_at = COALESCE(started_at, CURRENT_TIMESTAMP),' : ''}
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND module_id = ?`,
            [status, progress, completedExercises, userId, moduleId]
        );
        
        console.log(`📊 Обновлен прогресс модуля ${moduleId}: ${progress}% (${completedExercises}/${totalExercises})`);
    } catch (err) {
        console.error('Ошибка обновления прогресса модуля:', err);
    }
}

module.exports = router;