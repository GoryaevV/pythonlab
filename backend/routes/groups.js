// backend/routes/groups.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// Получить все группы
router.get('/', async (req, res) => {
    try {
        const groups = await db.query(`
            SELECT g.*, u.name as creator_name
            FROM groups g
            LEFT JOIN users u ON g.creator_id = u.id
            WHERE g.status = 'active'
            ORDER BY g.created_at DESC
        `);
        
        // Получаем количество участников для каждой группы
        for (let group of groups) {
            const members = await db.query(
                'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND is_active = 1',
                [group.id]
            );
            group.members_count = members[0].count;
            group.active_members = members[0].count;
        }
        
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создать новую группу
router.post('/', async (req, res) => {
    try {
        const { name, description, creator_id } = req.body;
        
        const result = await db.run(
            'INSERT INTO groups (name, description, creator_id) VALUES (?, ?, ?)',
            [name, description, creator_id]
        );
        
        // Добавляем создателя в участники группы
        await db.run(
            'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
            [result.id, creator_id]
        );
        
        res.json({ 
            id: result.id, 
            message: 'Группа создана',
            name,
            description,
            creator_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Присоединиться к группе
router.post('/:id/join', async (req, res) => {
    try {
        const { user_id } = req.body;
        
        // Проверяем, не состоит ли уже пользователь в группе
        const existing = await db.get(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
            [req.params.id, user_id]
        );
        
        if (existing) {
            return res.status(400).json({ error: 'Вы уже состоите в этой группе' });
        }
        
        // Добавляем пользователя в группу
        await db.run(
            'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
            [req.params.id, user_id]
        );
        
        // Обновляем счетчик участников
        await db.run(
            'UPDATE groups SET members_count = members_count + 1, active_members = active_members + 1 WHERE id = ?',
            [req.params.id]
        );
        
        res.json({ message: 'Вы присоединились к группе' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить участников группы
router.get('/:id/members', async (req, res) => {
    try {
        const members = await db.query(`
            SELECT u.id, u.name, u.avatar, u.role, gm.joined_at
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = ? AND gm.is_active = 1
            ORDER BY gm.joined_at
        `, [req.params.id]);
        
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;