const express = require('express');
const router = express.Router();
const db = require('../database');

// Получить все модули с прогрессом пользователя
router.get('/', async (req, res) => {
    try {
        const userId = req.query.user_id || 1;
        
        const modules = await db.query(`
            SELECT m.*, 
                   ump.status, ump.progress, ump.completed_exercises,
                   (SELECT COUNT(*) FROM exercises e WHERE e.module_id = m.id) as total_exercises
            FROM modules m
            LEFT JOIN user_module_progress ump ON m.id = ump.module_id AND ump.user_id = ?
            ORDER BY m.order_index
        `, [userId]);
        
        // Получаем темы для каждого модуля
        for (let module of modules) {
            const topics = await db.query(
                'SELECT topic FROM module_topics WHERE module_id = ?',
                [module.id]
            );
            module.topics = topics.map(t => t.topic);
        }
        
        res.json(modules);
    } catch (err) {
        console.error('Ошибка получения модулей:', err);
        res.status(500).json({ error: err.message });
    }
});

// Получить модуль по ID с детальной информацией
router.get('/:id', async (req, res) => {
    try {
        const userId = req.query.user_id || 1;
        const moduleId = req.params.id;
        
        // Получаем информацию о модуле
        const module = await db.get(`
            SELECT m.*, 
                   ump.status, ump.progress, ump.completed_exercises,
                   (SELECT COUNT(*) FROM exercises e WHERE e.module_id = m.id) as total_exercises
            FROM modules m
            LEFT JOIN user_module_progress ump ON m.id = ump.module_id AND ump.user_id = ?
            WHERE m.id = ?
        `, [userId, moduleId]);
        
        if (!module) {
            return res.status(404).json({ error: 'Модуль не найден' });
        }
        
        // Получаем темы модуля
        const topics = await db.query(
            'SELECT topic FROM module_topics WHERE module_id = ?',
            [moduleId]
        );
        module.topics = topics.map(t => t.topic);
        
        res.json(module);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Начать изучение модуля
router.post('/:id/start', async (req, res) => {
    try {
        const { user_id = 1 } = req.body;
        const moduleId = req.params.id;
        
        // Проверяем существование записи
        const existing = await db.get(
            'SELECT * FROM user_module_progress WHERE user_id = ? AND module_id = ?',
            [user_id, moduleId]
        );
        
        if (existing) {
            // Обновляем существующую запись
            await db.run(
                `UPDATE user_module_progress 
                 SET status = 'in-progress', 
                     progress = CASE WHEN progress < 10 THEN 10 ELSE progress END,
                     started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
                 WHERE user_id = ? AND module_id = ?`,
                [user_id, moduleId]
            );
        } else {
            // Создаем новую запись
            await db.run(
                `INSERT INTO user_module_progress (user_id, module_id, status, progress, started_at)
                 VALUES (?, ?, 'in-progress', 10, CURRENT_TIMESTAMP)`,
                [user_id, moduleId]
            );
        }
        
        res.json({ 
            success: true, 
            message: 'Модуль начат',
            status: 'in-progress',
            progress: 10
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Обновить прогресс модуля
router.put('/:id/progress', async (req, res) => {
    try {
        const { user_id = 1, progress, completed_exercises } = req.body;
        const moduleId = req.params.id;
        
        // Определяем статус на основе прогресса
        let status = 'in-progress';
        if (progress >= 100) {
            status = 'completed';
        } else if (progress <= 0) {
            status = 'not-started';
        }
        
        await db.run(
            `UPDATE user_module_progress 
             SET progress = ?, 
                 completed_exercises = ?,
                 status = ?,
                 ${status === 'completed' ? 'completed_at = CURRENT_TIMESTAMP,' : ''}
                 ${status === 'in-progress' && progress > 0 ? 'started_at = COALESCE(started_at, CURRENT_TIMESTAMP),' : ''}
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND module_id = ?`,
            [progress, completed_exercises, status, user_id, moduleId]
        );
        
        res.json({ 
            success: true, 
            message: 'Прогресс обновлен',
            progress,
            status
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Завершить модуль
router.post('/:id/complete', async (req, res) => {
    try {
        const { user_id = 1 } = req.body;
        const moduleId = req.params.id;
        
        await db.run(
            `UPDATE user_module_progress 
             SET status = 'completed', 
                 progress = 100,
                 completed_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND module_id = ?`,
            [user_id, moduleId]
        );
        
        res.json({ 
            success: true, 
            message: 'Модуль завершен',
            status: 'completed',
            progress: 100
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;