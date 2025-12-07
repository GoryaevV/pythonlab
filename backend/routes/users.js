// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// Получить всех пользователей
router.get('/', async (req, res) => {
    try {
        const users = await db.query('SELECT * FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить пользователя по ID
router.get('/:id', async (req, res) => {
    try {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создать нового пользователя
router.post('/', async (req, res) => {
    try {
        const { name, email, avatar = name.substring(0, 2), role = 'student' } = req.body;
        const result = await db.run(
            'INSERT INTO users (name, email, avatar, role) VALUES (?, ?, ?, ?)',
            [name, email, avatar, role]
        );
        
        // Инициализируем прогресс для нового пользователя
        await initializeUserProgress(result.id);
        
        res.json({ id: result.id, message: 'Пользователь создан' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Инициализировать прогресс пользователя
async function initializeUserProgress(userId) {
    const modules = await db.query('SELECT id FROM modules');
    for (const module of modules) {
        await db.run(
            'INSERT INTO user_module_progress (user_id, module_id) VALUES (?, ?)',
            [userId, module.id]
        );
    }
}

// Обновить прогресс пользователя по модулю
router.put('/:id/progress/:moduleId', async (req, res) => {
    try {
        const { status, progress, completed_exercises } = req.body;
        const result = await db.run(
            `UPDATE user_module_progress 
             SET status = ?, progress = ?, completed_exercises = ?,
                 ${status === 'completed' ? 'completed_at = CURRENT_TIMESTAMP' : ''}
             WHERE user_id = ? AND module_id = ?`,
            [status, progress, completed_exercises, req.params.id, req.params.moduleId]
        );
        res.json({ message: 'Прогресс обновлен', changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить прогресс пользователя
router.get('/:id/progress', async (req, res) => {
    try {
        const progress = await db.query(`
            SELECT m.id, m.title, m.description, m.duration,
                   ump.status, ump.progress, ump.completed_exercises,
                   (SELECT COUNT(*) FROM exercises e WHERE e.module_id = m.id) as total_exercises
            FROM modules m
            LEFT JOIN user_module_progress ump ON m.id = ump.module_id AND ump.user_id = ?
            ORDER BY m.order_index
        `, [req.params.id]);
        
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;