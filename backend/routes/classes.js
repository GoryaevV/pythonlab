const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database');

// Создание класса (для преподавателей)
router.post('/', async (req, res) => {
    try {
        const { teacher_id, course_id, name, description, start_date, end_date } = req.body;
        
        // Проверка, что пользователь - преподаватель
        const teacher = await db.get(
            'SELECT role FROM users WHERE id = ?',
            [teacher_id]
        );
        
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(403).json({ error: 'Только преподаватели могут создавать классы' });
        }
        
        // Генерация кода для присоединения
        const joinCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        
        // Создание класса
        const result = await db.run(
            `INSERT INTO classes (teacher_id, course_id, name, description, join_code, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [teacher_id, course_id, name, description, joinCode, start_date, end_date]
        );
        
        res.json({
            success: true,
            classId: result.id,
            joinCode,
            message: 'Класс создан успешно'
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создание приглашения в класс
router.post('/:classId/invitations', async (req, res) => {
    try {
        const { classId } = req.params;
        const { teacher_id, max_uses = 1, expires_hours = 168 } = req.body; // 168 часов = 7 дней
        
        // Проверка прав преподавателя
        const isTeacher = await db.get(
            'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
            [classId, teacher_id]
        );
        
        if (!isTeacher) {
            return res.status(403).json({ error: 'Только преподаватель класса может создавать приглашения' });
        }
        
        // Генерация кода приглашения
        const code = crypto.randomBytes(8).toString('hex');
        const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000);
        
        const result = await db.run(
            `INSERT INTO invitations (class_id, code, max_uses, expires_at, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            [classId, code, max_uses, expiresAt.toISOString(), teacher_id]
        );
        
        // Генерация ссылки
        const invitationLink = `${req.protocol}://${req.get('host')}/invite/${code}`;
        
        res.json({
            success: true,
            invitation: {
                id: result.id,
                code,
                link: invitationLink,
                max_uses,
                expires_at: expiresAt,
                class_id: classId
            }
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получение информации о классе
router.get('/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const { user_id } = req.query;
        
        const classInfo = await db.get(`
            SELECT c.*, u.name as teacher_name, cr.title as course_title,
                   (SELECT COUNT(*) FROM class_students WHERE class_id = c.id AND status = 'active') as student_count
            FROM classes c
            JOIN users u ON c.teacher_id = u.id
            JOIN courses cr ON c.course_id = cr.id
            WHERE c.id = ?
        `, [classId]);
        
        if (!classInfo) {
            return res.status(404).json({ error: 'Класс не найден' });
        }
        
        // Проверка доступа
        let hasAccess = false;
        let userRole = 'guest';
        
        if (user_id) {
            // Проверяем, является ли пользователь преподавателем
            if (parseInt(user_id) === classInfo.teacher_id) {
                hasAccess = true;
                userRole = 'teacher';
            } else {
                // Проверяем, является ли студентом класса
                const isStudent = await db.get(
                    'SELECT id FROM class_students WHERE class_id = ? AND student_id = ? AND status = "active"',
                    [classId, user_id]
                );
                
                if (isStudent) {
                    hasAccess = true;
                    userRole = 'student';
                }
            }
        }
        
        res.json({
            ...classInfo,
            hasAccess,
            userRole
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получение студентов класса (для преподавателя)
router.get('/:classId/students', async (req, res) => {
    try {
        const { classId } = req.params;
        const { teacher_id } = req.query;
        
        // Проверка прав преподавателя
        const isTeacher = await db.get(
            'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
            [classId, teacher_id]
        );
        
        if (!isTeacher) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        
        const students = await db.query(`
            SELECT u.id, u.name, u.email, u.avatar, cs.joined_at, cs.final_grade,
                   (SELECT COUNT(*) FROM student_progress sp 
                    JOIN lessons l ON sp.lesson_id = l.id 
                    JOIN course_modules cm ON l.module_id = cm.id 
                    WHERE sp.student_id = u.id AND cm.course_id = ?) as completed_lessons
            FROM class_students cs
            JOIN users u ON cs.student_id = u.id
            WHERE cs.class_id = ? AND cs.status = 'active'
            ORDER BY cs.joined_at DESC
        `, [classInfo.course_id, classId]);
        
        // Получение статистики по каждому студенту
        for (let student of students) {
            const progress = await db.get(`
                SELECT 
                    AVG(sp.progress) as avg_progress,
                    AVG(sp.score) as avg_score,
                    COUNT(sp.id) as total_exercises
                FROM student_progress sp
                JOIN lessons l ON sp.lesson_id = l.id
                JOIN course_modules cm ON l.module_id = cm.id
                WHERE sp.student_id = ? AND cm.course_id = ?
            `, [student.id, classInfo.course_id]);
            
            student.progress = progress || {};
        }
        
        res.json(students);
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Статистика класса
router.get('/:classId/statistics', async (req, res) => {
    try {
        const { classId } = req.params;
        const { teacher_id } = req.query;
        
        // Проверка прав преподавателя
        const isTeacher = await db.get(
            'SELECT id, course_id FROM classes WHERE id = ? AND teacher_id = ?',
            [classId, teacher_id]
        );
        
        if (!isTeacher) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        
        // Основная статистика
        const statistics = await db.get(`
            SELECT 
                COUNT(DISTINCT cs.student_id) as total_students,
                AVG(cs.final_grade) as avg_final_grade,
                (SELECT COUNT(*) FROM student_progress sp 
                 JOIN lessons l ON sp.lesson_id = l.id 
                 JOIN course_modules cm ON l.module_id = cm.id 
                 WHERE cm.course_id = ? AND sp.status = 'completed') as total_completed_lessons
            FROM class_students cs
            WHERE cs.class_id = ? AND cs.status = 'active'
        `, [isTeacher.course_id, classId]);
        
        // Прогресс по модулям
        const moduleProgress = await db.query(`
            SELECT cm.id, cm.title, 
                   COUNT(DISTINCT sp.student_id) as active_students,
                   AVG(sp.progress) as avg_progress,
                   AVG(sp.score) as avg_score
            FROM course_modules cm
            LEFT JOIN lessons l ON cm.id = l.module_id
            LEFT JOIN student_progress sp ON l.id = sp.lesson_id AND sp.student_id IN (
                SELECT student_id FROM class_students WHERE class_id = ?
            )
            WHERE cm.course_id = ?
            GROUP BY cm.id
            ORDER BY cm.order_index
        `, [classId, isTeacher.course_id]);
        
        // Динамика активности
        const activityTrend = await db.query(`
            SELECT DATE(sp.completed_at) as date,
                   COUNT(DISTINCT sp.student_id) as active_students,
                   COUNT(sp.id) as completed_exercises
            FROM student_progress sp
            JOIN class_students cs ON sp.student_id = cs.student_id
            WHERE cs.class_id = ? AND sp.completed_at IS NOT NULL
            GROUP BY DATE(sp.completed_at)
            ORDER BY date DESC
            LIMIT 30
        `, [classId]);
        
        res.json({
            overview: statistics,
            moduleProgress,
            activityTrend,
            lastUpdated: new Date().toISOString()
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;