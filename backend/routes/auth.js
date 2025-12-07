const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../database');

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role = 'student', invite_code } = req.body;
        
        // Проверка email
        const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ error: 'Email уже зарегистрирован' });
        }
        
        // Хэширование пароля
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Генерация токена верификации
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Создание пользователя
        const result = await db.run(
            `INSERT INTO users (email, password_hash, name, role, verification_token) 
             VALUES (?, ?, ?, ?, ?)`,
            [email, passwordHash, name, role, verificationToken]
        );
        
        // Если есть код приглашения
        if (invite_code && role === 'student') {
            await handleInvitation(invite_code, result.id);
        }
        
        // Отправка email для верификации (симуляция)
        console.log(`Верификационный токен для ${email}: ${verificationToken}`);
        
        res.json({ 
            success: true, 
            message: 'Регистрация успешна',
            userId: result.id,
            requiresVerification: true
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Логин
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Поиск пользователя
        const user = await db.get(
            'SELECT id, email, password_hash, name, role, email_verified FROM users WHERE email = ?',
            [email]
        );
        
        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        // Проверка верификации email
        if (!user.email_verified) {
            return res.status(403).json({ 
                error: 'Email не подтвержден',
                requiresVerification: true,
                userId: user.id
            });
        }
        
        // Генерация сессии (в реальном приложении использовать JWT)
        const sessionToken = crypto.randomBytes(64).toString('hex');
        
        res.json({
            success: true,
            token: sessionToken,  // Временное решение
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar || user.name.substring(0, 2)
            }
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Обработка приглашения
async function handleInvitation(inviteCode, studentId) {
    try {
        const invitation = await db.get(
            `SELECT i.*, c.id as class_id, c.teacher_id 
             FROM invitations i 
             JOIN classes c ON i.class_id = c.id 
             WHERE i.code = ? AND i.expires_at > CURRENT_TIMESTAMP`,
            [inviteCode]
        );
        
        if (!invitation) {
            throw new Error('Приглашение не найдено или истекло');
        }
        
        if (invitation.used_count >= invitation.max_uses) {
            throw new Error('Лимит использований приглашения исчерпан');
        }
        
        // Добавление студента в класс
        await db.run(
            'INSERT INTO class_students (class_id, student_id) VALUES (?, ?)',
            [invitation.class_id, studentId]
        );
        
        // Увеличение счетчика использований
        await db.run(
            'UPDATE invitations SET used_count = used_count + 1 WHERE id = ?',
            [invitation.id]
        );
        
        return { classId: invitation.class_id, teacherId: invitation.teacher_id };
        
    } catch (err) {
        console.error('Ошибка обработки приглашения:', err.message);
        throw err;
    }
}

module.exports = router;