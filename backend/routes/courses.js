const express = require('express');
const router = express.Router();
const db = require('../database');

// Получение всех курсов (публичных)
router.get('/', async (req, res) => {
    try {
        const { user_id, category, difficulty } = req.query;
        
        let query = `
            SELECT c.*, u.name as author_name,
                   COUNT(cm.id) as module_count,
                   (SELECT COUNT(*) FROM classes WHERE course_id = c.id) as class_count
            FROM courses c
            LEFT JOIN users u ON c.creator_id = u.id
            LEFT JOIN course_modules cm ON c.id = cm.course_id
            WHERE c.is_public = 1
        `;
        
        const params = [];
        
        if (category) {
            query += ' AND c.category = ?';
            params.push(category);
        }
        
        if (difficulty) {
            query += ' AND c.difficulty = ?';
            params.push(difficulty);
        }
        
        query += ' GROUP BY c.id ORDER BY c.created_at DESC';
        
        const courses = await db.query(query, params);
        
        // Для зарегистрированных пользователей добавляем информацию о прогрессе
        if (user_id) {
            for (let course of courses) {
                const progress = await db.get(`
                    SELECT COUNT(sp.id) as completed_lessons,
                           AVG(sp.progress) as avg_progress
                    FROM student_progress sp
                    JOIN lessons l ON sp.lesson_id = l.id
                    JOIN course_modules cm ON l.module_id = cm.id
                    WHERE sp.student_id = ? AND cm.course_id = ? AND sp.status = 'completed'
                `, [user_id, course.id]);
                
                course.userProgress = progress || {};
            }
        }
        
        res.json(courses);
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получение курса с модулями и уроками
router.get('/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { user_id } = req.query;
        
        // Основная информация о курсе
        const course = await db.get(`
            SELECT c.*, u.name as author_name, u.email as author_email
            FROM courses c
            LEFT JOIN users u ON c.creator_id = u.id
            WHERE c.id = ?
        `, [courseId]);
        
        if (!course) {
            return res.status(404).json({ error: 'Курс не найден' });
        }
        
        // Модули курса
        const modules = await db.query(`
            SELECT cm.*,
                   COUNT(l.id) as lesson_count,
                   SUM(l.duration_minutes) as total_minutes
            FROM course_modules cm
            LEFT JOIN lessons l ON cm.id = l.module_id
            WHERE cm.course_id = ?
            GROUP BY cm.id
            ORDER BY cm.order_index
        `, [courseId]);
        
        // Уроки для каждого модуля
        for (let module of modules) {
            const lessons = await db.query(`
                SELECT l.*,
                       COUNT(le.id) as exercise_count
                FROM lessons l
                LEFT JOIN lesson_exercises le ON l.id = le.lesson_id
                WHERE l.module_id = ?
                GROUP BY l.id
                ORDER BY l.order_index
            `, [module.id]);
            
            // Прогресс пользователя по урокам
            if (user_id) {
                for (let lesson of lessons) {
                    const progress = await db.get(`
                        SELECT status, progress, score, completed_at
                        FROM student_progress
                        WHERE student_id = ? AND lesson_id = ? AND exercise_id IS NULL
                    `, [user_id, lesson.id]);
                    
                    lesson.userProgress = progress || { status: 'not_started', progress: 0 };
                }
            }
            
            module.lessons = lessons;
        }
        
        course.modules = modules;
        
        res.json(course);
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создание курса (для преподавателей и администраторов)
router.post('/', async (req, res) => {
    try {
        const { creator_id, title, description, category, difficulty, duration_hours } = req.body;
        
        // Проверка прав
        const user = await db.get(
            'SELECT role FROM users WHERE id = ?',
            [creator_id]
        );
        
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
            return res.status(403).json({ error: 'Недостаточно прав для создания курса' });
        }
        
        const result = await db.run(
            `INSERT INTO courses (title, description, category, difficulty, duration_hours, creator_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, category, difficulty, duration_hours, creator_id]
        );
        
        res.json({
            success: true,
            courseId: result.id,
            message: 'Курс создан успешно'
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;