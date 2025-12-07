<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// ========== ХРАНЕНИЕ ДАННЫХ ==========

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const CLASS_STUDENTS_FILE = path.join(DATA_DIR, 'class_students.json');

// Создаем папку для данных, если ее нет
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Функции для работы с данными
function loadData(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Ошибка загрузки данных из ${filePath}:`, error);
    }
    return defaultValue;
}

function saveData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Ошибка сохранения данных в ${filePath}:`, error);
        return false;
    }
}

// Загружаем данные
let users = loadData(USERS_FILE, [
    {
        id: 1,
        email: 'teacher@pythonlab.ru',
        name: 'Анна Петрова',
        role: 'teacher',
        password: 'password123',
        avatar: 'АП',
        email_verified: true,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        email: 'student@pythonlab.ru',
        name: 'Иван Сидоров',
        role: 'student',
        password: 'password123',
        avatar: 'ИС',
        email_verified: true,
        created_at: new Date().toISOString()
    }
]);

let courses = loadData(COURSES_FILE, [
    {
        id: 1,
        title: 'Python для начинающих',
        description: 'Освоите основы программирования на Python с нуля',
        category: 'programming',
        difficulty: 'beginner',
        duration_hours: 40,
        is_public: true,
        creator_id: 1,
        author_name: 'Анна Петрова',
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        title: 'Алгоритмы и структуры данных',
        description: 'Углубленное изучение алгоритмов на Python',
        category: 'algorithms',
        difficulty: 'intermediate',
        duration_hours: 60,
        is_public: true,
        creator_id: 1,
        author_name: 'Анна Петрова',
        created_at: new Date().toISOString()
    }
]);

let classes = loadData(CLASSES_FILE, [
    {
        id: 1,
        teacher_id: 1,
        course_id: 1,
        name: 'Python для гуманитариев 2024',
        description: 'Группа для студентов гуманитарных специальностей',
        join_code: 'PYTHON2024',
        start_date: '2024-09-01',
        end_date: '2024-12-31',
        is_active: true,
        created_at: new Date().toISOString()
    }
]);

let classStudents = loadData(CLASS_STUDENTS_FILE, [
    {
        id: 1,
        class_id: 1,
        student_id: 2,
        joined_at: '2024-09-01',
        status: 'active',
        final_grade: null
    }
]);

// Функция для сохранения всех данных
function saveAllData() {
    saveData(USERS_FILE, users);
    saveData(COURSES_FILE, courses);
    saveData(CLASSES_FILE, classes);
    saveData(CLASS_STUDENTS_FILE, classStudents);
}

// Автосохранение каждые 30 секунд
setInterval(saveAllData, 30000);

// ========== API ENDPOINTS ==========

// 1. Базовые тестовые endpoints
app.get('/api/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'PythonLab API работает корректно!',
        serverTime: new Date().toISOString(),
        port: PORT,
        version: '2.0',
        usersCount: users.length,
        coursesCount: courses.length,
        classesCount: classes.length
    });
});

app.get('/api/hello', (req, res) => {
    res.json({
        message: 'Hello from PythonLab!',
        timestamp: new Date().toISOString(),
        totalUsers: users.length
    });
});

// 2. Аутентификация
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', { email });
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
=======
// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend')); // Раздача статических файлов

// Подключение к PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pythonlab',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Проверка подключения к БД
pool.connect((err, client, release) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
    } else {
        console.log('✅ Успешное подключение к PostgreSQL');
        release();
    }
});

// Секретный ключ для JWT (в продакшене использовать переменные окружения)
const JWT_SECRET = process.env.JWT_SECRET || 'pythonlab-secret-key-2024';

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Токен не предоставлен' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Middleware для проверки роли преподавателя
const requireTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Требуется роль преподавателя' });
    }
    next();
};

// ========== АУТЕНТИФИКАЦИЯ ==========

// Регистрация пользователя
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role, invite_code } = req.body;
        
        // Валидация
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                error: 'Все поля обязательны' 
            });
        }
        
        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Недопустимая роль' 
            });
        }
        
        // Проверка уникальности email
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Пользователь с таким email уже существует' 
            });
        }
        
        // Хеширование пароля
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Создание пользователя
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, email, role, created_at`,
            [name, email.toLowerCase(), passwordHash, role]
        );
        
        const user = result.rows[0];
        
        // Если есть код приглашения и пользователь - студент
        if (invite_code && role === 'student') {
            try {
                await handleInvitation(user.id, invite_code);
            } catch (inviteError) {
                console.log('Ошибка обработки приглашения:', inviteError);
                // Не прерываем регистрацию, только логируем ошибку
            }
        }
        
        // Генерация JWT токена
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: 'Регистрация успешна',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при регистрации' 
        });
    }
});

// Вход в систему
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
>>>>>>> a3f21f6415954d2d231aa65722fbbb6ba911b802
                error: 'Email и пароль обязательны' 
            });
        }
        
<<<<<<< HEAD
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Пользователь не найден' 
            });
        }
        
        if (password !== user.password) {
            console.log('Wrong password for:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Неверный пароль' 
            });
        }
        
        if (!user.email_verified) {
            return res.status(403).json({ 
                success: false,
                error: 'Email не подтвержден',
                requiresVerification: true
            });
        }
        
        // Успешный логин
        const token = `token_${Date.now()}_${user.id}`;
        
        console.log('Login successful for:', email);
        
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar || user.name.substring(0, 2).toUpperCase()
=======
        // Поиск пользователя
        const result = await pool.query(
            'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Неверный email или пароль' 
            });
        }
        
        const user = result.rows[0];
        
        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Неверный email или пароль' 
            });
        }
        
        // Генерация JWT токена
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при входе' 
        });
    }
});

// Проверка токена
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// ========== КУРСЫ ==========

// Получение всех курсов
app.get('/api/courses', async (req, res) => {
    try {
        const { category, difficulty, teacher_id } = req.query;
        
        let query = `
            SELECT 
                c.*,
                u.name as teacher_name,
                (SELECT COUNT(*) FROM class_students cs 
                 JOIN classes cl ON cs.class_id = cl.id 
                 WHERE cl.course_id = c.id) as student_count,
                (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
            FROM courses c
            JOIN users u ON c.teacher_id = u.id
            WHERE c.status = 'published'
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (category) {
            query += ` AND c.category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }
        
        if (difficulty) {
            query += ` AND c.difficulty = $${paramCount}`;
            params.push(difficulty);
            paramCount++;
        }
        
        if (teacher_id) {
            query += ` AND c.teacher_id = $${paramCount}`;
            params.push(teacher_id);
            paramCount++;
        }
        
        query += ' ORDER BY c.created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            courses: result.rows
        });
        
    } catch (error) {
        console.error('Ошибка получения курсов:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении курсов' 
        });
    }
});

// Создание курса (только для преподавателей)
app.post('/api/courses', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { title, description, category, difficulty, duration_hours } = req.body;
        
        if (!title || !description || !category || !difficulty) {
            return res.status(400).json({ 
                success: false, 
                error: 'Все обязательные поля должны быть заполнены' 
            });
        }
        
        const result = await pool.query(
            `INSERT INTO courses 
             (title, description, category, difficulty, duration_hours, teacher_id, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'draft') 
             RETURNING *`,
            [title, description, category, difficulty, duration_hours || 40, req.user.id]
        );
        
        res.json({
            success: true,
            course: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка создания курса:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при создании курса' 
        });
    }
});

// Получение курса по ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                c.*,
                u.name as teacher_name,
                u.email as teacher_email
             FROM courses c
             JOIN users u ON c.teacher_id = u.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Курс не найден' 
            });
        }
        
        res.json({
            success: true,
            course: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка получения курса:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении курса' 
        });
    }
});

// Обновление курса
app.put('/api/courses/:id', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { title, description, category, difficulty, duration_hours, status } = req.body;
        
        // Проверяем, что курс принадлежит преподавателю
        const checkResult = await pool.query(
            'SELECT teacher_id FROM courses WHERE id = $1',
            [req.params.id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Курс не найден' 
            });
        }
        
        if (checkResult.rows[0].teacher_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на редактирование этого курса' 
            });
        }
        
        const result = await pool.query(
            `UPDATE courses 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 category = COALESCE($3, category),
                 difficulty = COALESCE($4, difficulty),
                 duration_hours = COALESCE($5, duration_hours),
                 status = COALESCE($6, status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [title, description, category, difficulty, duration_hours, status, req.params.id]
        );
        
        res.json({
            success: true,
            course: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка обновления курса:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при обновлении курса' 
        });
    }
});

// Удаление курса
app.delete('/api/courses/:id', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { teacher_id } = req.query;
        
        if (parseInt(teacher_id) !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на удаление этого курса' 
            });
        }
        
        // Проверяем, есть ли связанные классы
        const classesResult = await pool.query(
            'SELECT COUNT(*) FROM classes WHERE course_id = $1',
            [req.params.id]
        );
        
        if (parseInt(classesResult.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Нельзя удалить курс, к которому привязаны классы' 
            });
        }
        
        // Удаляем уроки и задачи курса
        await pool.query('DELETE FROM tasks WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = $1)', [req.params.id]);
        await pool.query('DELETE FROM lessons WHERE course_id = $1', [req.params.id]);
        
        // Удаляем курс
        const result = await pool.query(
            'DELETE FROM courses WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Курс не найден' 
            });
        }
        
        res.json({
            success: true,
            message: 'Курс успешно удален'
        });
        
    } catch (error) {
        console.error('Ошибка удаления курса:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при удалении курса' 
        });
    }
});

// Получение курсов преподавателя
app.get('/api/teacher/:teacher_id/courses', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.params.teacher_id;
        
        if (req.user.id !== parseInt(teacherId) && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на просмотр этих курсов' 
            });
        }
        
        const result = await pool.query(
            `SELECT 
                c.*,
                (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count,
                (SELECT COUNT(*) FROM class_students cs 
                 JOIN classes cl ON cs.class_id = cl.id 
                 WHERE cl.course_id = c.id) as student_count,
                (SELECT COUNT(*) FROM classes WHERE course_id = c.id) as class_count
             FROM courses c
             WHERE c.teacher_id = $1
             ORDER BY c.created_at DESC`,
            [teacherId]
        );
        
        res.json({
            success: true,
            courses: result.rows
        });
        
    } catch (error) {
        console.error('Ошибка получения курсов преподавателя:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении курсов' 
        });
    }
});

// ========== УРОКИ ==========

// Создание урока
app.post('/api/lessons', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { 
            course_id, 
            module_number, 
            title, 
            order_number, 
            duration_hours, 
            lesson_type,
            content, 
            learning_objectives, 
            additional_materials 
        } = req.body;
        
        if (!course_id || !title || !content) {
            return res.status(400).json({ 
                success: false, 
                error: 'Обязательные поля: course_id, title, content' 
            });
        }
        
        // Проверяем, что курс принадлежит преподавателю
        const courseCheck = await pool.query(
            'SELECT teacher_id FROM courses WHERE id = $1',
            [course_id]
        );
        
        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Курс не найден' 
            });
        }
        
        if (courseCheck.rows[0].teacher_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на создание урока в этом курсе' 
            });
        }
        
        const result = await pool.query(
            `INSERT INTO lessons 
             (course_id, module_number, title, order_number, duration_hours, 
              lesson_type, content, learning_objectives, additional_materials, teacher_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [
                course_id, 
                module_number || 1, 
                title, 
                order_number || 1, 
                duration_hours || 1.5, 
                lesson_type || 'lecture',
                content, 
                learning_objectives, 
                additional_materials, 
                req.user.id
            ]
        );
        
        res.json({
            success: true,
            lesson: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка создания урока:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при создании урока' 
        });
    }
});

// Получение урока по ID
app.get('/api/lessons/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                l.*,
                c.title as course_title,
                u.name as teacher_name
             FROM lessons l
             JOIN courses c ON l.course_id = c.id
             JOIN users u ON l.teacher_id = u.id
             WHERE l.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Урок не найден' 
            });
        }
        
        res.json({
            success: true,
            lesson: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка получения урока:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении урока' 
        });
    }
});

// Обновление урока
app.put('/api/lessons/:id', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { 
            title, 
            content, 
            duration_hours, 
            learning_objectives, 
            additional_materials,
            status, 
            access_level, 
            tags 
        } = req.body;
        
        // Проверяем, что урок принадлежит преподавателю
        const checkResult = await pool.query(
            'SELECT teacher_id FROM lessons WHERE id = $1',
            [req.params.id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Урок не найден' 
            });
        }
        
        if (checkResult.rows[0].teacher_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на редактирование этого урока' 
            });
        }
        
        // Создаем новую версию
        await pool.query(
            `INSERT INTO lesson_versions 
             (lesson_id, title, content, version, teacher_id) 
             SELECT id, title, content, version, teacher_id 
             FROM lessons 
             WHERE id = $1`,
            [req.params.id]
        );
        
        // Обновляем урок
        const result = await pool.query(
            `UPDATE lessons 
             SET title = COALESCE($1, title),
                 content = COALESCE($2, content),
                 duration_hours = COALESCE($3, duration_hours),
                 learning_objectives = COALESCE($4, learning_objectives),
                 additional_materials = COALESCE($5, additional_materials),
                 status = COALESCE($6, status),
                 access_level = COALESCE($7, access_level),
                 tags = COALESCE($8, tags),
                 version = version + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [
                title, content, duration_hours, learning_objectives, additional_materials,
                status, access_level, tags ? tags.split(',').map(t => t.trim()) : null,
                req.params.id
            ]
        );
        
        res.json({
            success: true,
            lesson: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка обновления урока:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при обновлении урока' 
        });
    }
});

// Получение уроков курса
app.get('/api/courses/:course_id/lessons', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                l.*,
                (SELECT COUNT(*) FROM tasks WHERE lesson_id = l.id) as task_count
             FROM lessons l
             WHERE l.course_id = $1 AND l.status = 'published'
             ORDER BY l.module_number, l.order_number`,
            [req.params.course_id]
        );
        
        res.json({
            success: true,
            lessons: result.rows
        });
        
    } catch (error) {
        console.error('Ошибка получения уроков курса:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении уроков' 
        });
    }
});

// Получение задач урока
app.get('/api/lessons/:lesson_id/tasks', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM tasks 
             WHERE lesson_id = $1 
             ORDER BY created_at`,
            [req.params.lesson_id]
        );
        
        res.json({
            success: true,
            tasks: result.rows
        });
        
    } catch (error) {
        console.error('Ошибка получения задач:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении задач' 
        });
    }
});

// Статистика урока
app.get('/api/lessons/:id/stats', authenticateToken, async (req, res) => {
    try {
        const lessonId = req.params.id;
        
        // Проверяем права доступа
        const lessonCheck = await pool.query(
            'SELECT teacher_id FROM lessons WHERE id = $1',
            [lessonId]
        );
        
        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Урок не найден' 
            });
        }
        
        if (lessonCheck.rows[0].teacher_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на просмотр статистики' 
            });
        }
        
        // Базовая статистика
        const statsResult = await pool.query(
            `SELECT 
                COUNT(DISTINCT cs.student_id) as total_students,
                COUNT(DISTINCT CASE WHEN s.score >= 60 THEN s.student_id END) as completed_students
             FROM class_students cs
             JOIN classes c ON cs.class_id = c.id
             JOIN lessons l ON c.course_id = l.course_id
             LEFT JOIN submissions s ON cs.student_id = s.student_id 
                AND s.task_id IN (SELECT id FROM tasks WHERE lesson_id = l.id)
             WHERE l.id = $1`,
            [lessonId]
        );
        
        const stats = statsResult.rows[0];
        const total = parseInt(stats.total_students) || 0;
        const completed = parseInt(stats.completed_students) || 0;
        
        const statsData = {
            total_students: total,
            completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
            average_time: 1.2, // Заглушка
            dropout_rate: total > 0 ? Math.round(((total - completed) / total) * 100) : 0
        };
        
        // Детальная статистика по задачам
        const detailedResult = await pool.query(
            `SELECT 
                t.id as task_id,
                t.title as task_title,
                COUNT(s.id) as total_submissions,
                COUNT(CASE WHEN s.score >= t.points * 0.6 THEN 1 END) as successful_submissions
             FROM tasks t
             LEFT JOIN submissions s ON t.id = s.task_id
             WHERE t.lesson_id = $1
             GROUP BY t.id, t.title`,
            [lessonId]
        );
        
        statsData.detailed = detailedResult.rows.map(row => ({
            task_id: row.task_id,
            task_title: row.task_title,
            success_rate: row.total_submissions > 0 
                ? Math.round((row.successful_submissions / row.total_submissions) * 100) 
                : 0,
            total_submissions: parseInt(row.total_submissions) || 0
        }));
        
        res.json({
            success: true,
            stats: statsData
        });
        
    } catch (error) {
        console.error('Ошибка получения статистики урока:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении статистики' 
        });
    }
});

// ========== ЗАДАЧИ ==========

// Создание задачи
app.post('/api/tasks', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { 
            lesson_id, 
            title, 
            description, 
            difficulty, 
            points, 
            expected_result,
            starter_code, 
            hints, 
            solution, 
            tests 
        } = req.body;
        
        if (!lesson_id || !title || !description || !solution) {
            return res.status(400).json({ 
                success: false, 
                error: 'Обязательные поля: lesson_id, title, description, solution' 
            });
        }
        
        // Проверяем, что урок принадлежит преподавателю
        const lessonCheck = await pool.query(
            `SELECT l.teacher_id 
             FROM lessons l
             WHERE l.id = $1`,
            [lesson_id]
        );
        
        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Урок не найден' 
            });
        }
        
        if (lessonCheck.rows[0].teacher_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на создание задачи в этом уроке' 
            });
        }
        
        const result = await pool.query(
            `INSERT INTO tasks 
             (lesson_id, title, description, difficulty, points, expected_result,
              starter_code, hints, solution, tests, teacher_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING *`,
            [
                lesson_id, 
                title, 
                description, 
                difficulty || 'beginner', 
                points || 10, 
                expected_result,
                starter_code, 
                hints, 
                solution, 
                tests, 
                req.user.id
            ]
        );
        
        res.json({
            success: true,
            task: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка создания задачи:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при создании задачи' 
        });
    }
});

// Получение задачи по ID
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                t.*,
                l.title as lesson_title,
                c.title as course_title,
                u.name as teacher_name
             FROM tasks t
             JOIN lessons l ON t.lesson_id = l.id
             JOIN courses c ON l.course_id = c.id
             JOIN users u ON t.teacher_id = u.id
             WHERE t.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Задача не найден' 
            });
        }
        
        res.json({
            success: true,
            task: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка получения задачи:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении задачи' 
        });
    }
});

// Обновление задачи
app.put('/api/tasks/:id', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { 
            title, 
            description, 
            difficulty, 
            points, 
            expected_result,
            starter_code, 
            hints, 
            solution, 
            tests 
        } = req.body;
        
        // Проверяем, что задача принадлежит преподавателю
        const checkResult = await pool.query(
            'SELECT teacher_id FROM tasks WHERE id = $1',
            [req.params.id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Задача не найден' 
            });
        }
        
        if (checkResult.rows[0].teacher_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на редактирование этой задачи' 
            });
        }
        
        const result = await pool.query(
            `UPDATE tasks 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 difficulty = COALESCE($3, difficulty),
                 points = COALESCE($4, points),
                 expected_result = COALESCE($5, expected_result),
                 starter_code = COALESCE($6, starter_code),
                 hints = COALESCE($7, hints),
                 solution = COALESCE($8, solution),
                 tests = COALESCE($9, tests),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10
             RETURNING *`,
            [
                title, description, difficulty, points, expected_result,
                starter_code, hints, solution, tests, req.params.id
            ]
        );
        
        res.json({
            success: true,
            task: result.rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка обновления задачи:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при обновлении задачи' 
        });
    }
});

// Удаление задачи
app.delete('/api/tasks/:id', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { teacher_id } = req.query;
        
        if (parseInt(teacher_id) !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на удаление этой задачи' 
            });
        }
        
        // Удаляем связанные решения
        await pool.query('DELETE FROM submissions WHERE task_id = $1', [req.params.id]);
        
        // Удаляем задачу
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Задача не найден' 
            });
        }
        
        res.json({
            success: true,
            message: 'Задача успешно удалена'
        });
        
    } catch (error) {
        console.error('Ошибка удаления задачи:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при удалении задачи' 
        });
    }
});

// Отправка решения задачи
app.post('/api/tasks/:id/submit', authenticateToken, async (req, res) => {
    try {
        const { code, language } = req.body;
        const taskId = req.params.id;
        const studentId = req.user.id;
        
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Код решения обязателен' 
            });
        }
        
        // Получаем данные задачи для проверки
        const taskResult = await pool.query(
            'SELECT solution, tests, points FROM tasks WHERE id = $1',
            [taskId]
        );
        
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Задача не найден' 
            });
        }
        
        const task = taskResult.rows[0];
        
        // Вызываем Python сервис проверки
        let evaluationResult;
        try {
            const evaluatorResponse = await fetch('http://localhost:3002/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task: task,
                    code: code,
                    language: language || 'python'
                }),
                timeout: 30000 // 30 секунд таймаут
            });
            
            if (!evaluatorResponse.ok) {
                throw new Error(`Сервис проверки вернул ошибку: ${evaluatorResponse.status}`);
            }
            
            evaluationResult = await evaluatorResponse.json();
            
        } catch (evaluatorError) {
            console.error('Ошибка обращения к сервису проверки:', evaluatorError);
            
            // Если сервис проверки недоступен, делаем простую проверку
            evaluationResult = {
                success: true,
                result: {
                    passed: false,
                    score: 0,
                    output: 'Сервис проверки временно недоступен',
                    errors: evaluatorError.message,
                    execution_time: 0
                }
            };
        }
        
        // Сохраняем результат в БД
        const submissionResult = await pool.query(
            `INSERT INTO submissions 
             (task_id, student_id, code, language, result, score) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [
                taskId,
                studentId,
                code,
                language || 'python',
                evaluationResult.result,
                evaluationResult.result.score || 0
            ]
        );
        
        // Обновляем статистику студента
        await updateStudentProgress(studentId, taskId, evaluationResult.result.score || 0);
        
        res.json({
            success: true,
            submission: submissionResult.rows[0],
            result: evaluationResult.result
        });
        
    } catch (error) {
        console.error('Ошибка отправки решения:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при отправке решения' 
        });
    }
});

// Статистика задачи
app.get('/api/tasks/:id/stats', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        
        // Проверяем права доступа
        const taskCheck = await pool.query(
            'SELECT teacher_id FROM tasks WHERE id = $1',
            [taskId]
        );
        
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Задача не найден' 
            });
        }
        
        if (taskCheck.rows[0].teacher_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на просмотр статистики' 
            });
        }
        
        // Общая статистика
        const statsResult = await pool.query(
            `SELECT 
                COUNT(*) as attempts,
                COUNT(CASE WHEN score >= (SELECT points FROM tasks WHERE id = $1) * 0.6 THEN 1 END) as successful_attempts,
                AVG(score) as average_score
             FROM submissions 
             WHERE task_id = $1`,
            [taskId]
        );
        
        const stats = statsResult.rows[0];
        const attempts = parseInt(stats.attempts) || 0;
        const successful = parseInt(stats.successful_attempts) || 0;
        
        const statsData = {
            attempts: attempts,
            success_rate: attempts > 0 ? Math.round((successful / attempts) * 100) : 0,
            average_score: parseFloat(stats.average_score) || 0,
            common_errors: [] // Заглушка
        };
        
        // Статистика по дням
        const dailyResult = await pool.query(
            `SELECT 
                DATE(submitted_at) as date,
                COUNT(*) as count,
                COUNT(CASE WHEN score >= (SELECT points FROM tasks WHERE id = $1) * 0.6 THEN 1 END) as successful
             FROM submissions 
             WHERE task_id = $1
             GROUP BY DATE(submitted_at)
             ORDER BY date DESC
             LIMIT 7`,
            [taskId]
        );
        
        statsData.submissions = dailyResult.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count) || 0,
            success_rate: row.count > 0 ? Math.round((row.successful / row.count) * 100) : 0
        }));
        
        res.json({
            success: true,
            stats: statsData
        });
        
    } catch (error) {
        console.error('Ошибка получения статистики задачи:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении статистики' 
        });
    }
});

// ========== КЛАССЫ ==========

// Создание класса
app.post('/api/classes', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { course_id, name, description, start_date, end_date } = req.body;
        
        if (!course_id || !name) {
            return res.status(400).json({ 
                success: false, 
                error: 'Обязательные поля: course_id, name' 
            });
        }
        
        // Проверяем, что курс принадлежит преподавателю
        const courseCheck = await pool.query(
            'SELECT teacher_id, title FROM courses WHERE id = $1',
            [course_id]
        );
        
        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Курс не найден' 
            });
        }
        
        if (courseCheck.rows[0].teacher_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на создание класса для этого курса' 
            });
        }
        
        // Генерируем код приглашения
        const joinCode = generateInviteCode();
        
        const result = await pool.query(
            `INSERT INTO classes 
             (course_id, teacher_id, name, description, start_date, end_date, join_code) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [
                course_id, 
                req.user.id, 
                name, 
                description, 
                start_date, 
                end_date, 
                joinCode
            ]
        );
        
        const classData = result.rows[0];
        
        res.json({
            success: true,
            class: {
                ...classData,
                course_title: courseCheck.rows[0].title
>>>>>>> a3f21f6415954d2d231aa65722fbbb6ba911b802
            }
        });
        
    } catch (error) {
<<<<<<< HEAD
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Внутренняя ошибка сервера',
            details: error.message 
=======
        console.error('Ошибка создания класса:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при создании класса' 
>>>>>>> a3f21f6415954d2d231aa65722fbbb6ba911b802
        });
    }
});

<<<<<<< HEAD
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role = 'student', invite_code } = req.body;
    
    console.log('Registration attempt:', { name, email, role, invite_code });
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Все поля обязательны' 
      });
    }
    
    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный email' 
      });
    }
    
    // Проверка существования пользователя
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Пользователь с таким email уже существует' 
      });
    }
    
    // Проверка пароля
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Пароль должен быть не менее 6 символов' 
      });
    }
    
    // ========== ВАЖНО: Проверка приглашения для студентов ==========
    let invitedClass = null;
    if (role === 'student' && invite_code) {
      // Проверяем валидность кода приглашения
      invitedClass = classes.find(c => c.join_code === invite_code && c.is_active);
      
      if (!invitedClass) {
        return res.status(400).json({ 
          success: false,
          error: 'Недействительный код приглашения. Обратитесь к преподавателю' 
        });
      }
      
      // Проверяем даты класса (ИСПРАВЛЕННАЯ ПРОВЕРКА)
      const now = new Date();
      const startDate = new Date(invitedClass.start_date);
      const endDate = new Date(invitedClass.end_date);
      endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
      
      if (now < startDate) {
        return res.status(400).json({ 
          success: false,
          error: 'Класс еще не начался' 
        });
      }
      
      if (now > endDate) {
        return res.status(400).json({ 
          success: false,
          error: 'Класс уже завершился' 
        });
      }
    }
    
    // Создание нового пользователя
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      email: email,
      name: name,
      role: role === 'teacher' ? 'teacher' : 'student',
      password: password,
      avatar: name.substring(0, 2).toUpperCase(),
      email_verified: true,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    saveData(USERS_FILE, users);
    
    // ========== ВАЖНО: Добавляем студента в класс только если код валидный ==========
    let classJoined = null;
    let classInfo = null;
    
    if (role === 'student' && invitedClass) {
      // Проверяем, не состоит ли уже студент в классе
      const existingInClass = classStudents.find(cs => 
        cs.class_id === invitedClass.id && cs.student_id === newUser.id
      );
      
      if (!existingInClass) {
        const newClassStudent = {
          id: classStudents.length > 0 ? Math.max(...classStudents.map(cs => cs.id)) + 1 : 1,
          class_id: invitedClass.id,
          student_id: newUser.id,
          joined_at: new Date().toISOString(),
          status: 'active',
          final_grade: null
        };
        
        classStudents.push(newClassStudent);
        saveData(CLASS_STUDENTS_FILE, classStudents);
        
        classJoined = invitedClass.name;
        classInfo = invitedClass;
      }
    }
    
    console.log('Registration successful for:', email, 'ID:', newUser.id);
    
    // Создаем токен для автоматического входа
    const token = `token_${Date.now()}_${newUser.id}`;
    
    res.json({
      success: true,
      message: 'Регистрация успешна' + (classJoined ? `. Вы добавлены в класс: ${classJoined}` : ''),
      token: token,
      userId: newUser.id,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar
      },
      classJoined: classJoined,
      classInfo: classInfo,
      requiresVerification: false
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message 
    });
  }
});

app.get('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false,
            error: 'Токен не предоставлен' 
        });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const tokenParts = token.split('_');
    
    if (tokenParts.length < 3) {
        return res.status(401).json({ 
            success: false,
            error: 'Неверный токен' 
        });
    }
    
    const userId = parseInt(tokenParts[2]);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(401).json({ 
            success: false,
            error: 'Пользователь не найден' 
        });
    }
    
    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar || user.name.substring(0, 2).toUpperCase()
        }
    });
});

// 3. Получить всех пользователей (для отладки)
app.get('/api/auth/users', (req, res) => {
    res.json({
        success: true,
        users: users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            created_at: u.created_at
        })),
        count: users.length
    });
});

// 4. Удалить пользователя (для отладки)
app.delete('/api/auth/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const initialLength = users.length;
    
    users = users.filter(u => u.id !== userId);
    
    if (users.length < initialLength) {
        saveData(USERS_FILE, users);
        res.json({
            success: true,
            message: `Пользователь с ID ${userId} удален`,
            remainingUsers: users.length
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Пользователь не найден'
        });
    }
});

// 5. Курсы
app.get('/api/courses', (req, res) => {
  try {
    res.json({
      success: true,
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        duration_hours: course.duration_hours,
        author_name: course.author_name,
        created_at: course.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки курсов' });
  }
});

// 6. Создать новый курс (для преподавателей)
app.post('/api/courses', (req, res) => {
  try {
    const { teacher_id, title, description, category = 'programming', difficulty = 'beginner', duration_hours = 40 } = req.body;
    
    // Проверяем, что пользователь - преподаватель
    const teacher = users.find(u => u.id === teacher_id && u.role === 'teacher');
    
    if (!teacher) {
      return res.status(403).json({ 
        success: false, 
        error: 'Только преподаватели могут создавать курсы' 
      });
    }
    
    // Создаем курс
    const newCourse = {
      id: courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1,
      title: title,
      description: description,
      category: category,
      difficulty: difficulty,
      duration_hours: duration_hours,
      creator_id: teacher_id,
      author_name: teacher.name,
      is_public: true,
      created_at: new Date().toISOString()
    };
    
    courses.push(newCourse);
    saveData(COURSES_FILE, courses);
    
    res.json({
      success: true,
      message: 'Курс создан успешно',
      course: newCourse
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка создания курса' });
  }
});

// 7. Создать класс (для преподавателей)
app.post('/api/classes', (req, res) => {
  try {
    const { teacher_id, course_id, name, description, start_date, end_date } = req.body;
    
    // Проверяем, что пользователь - преподаватель
    const teacher = users.find(u => u.id === teacher_id && u.role === 'teacher');
    if (!teacher) {
      return res.status(403).json({ 
        success: false, 
        error: 'Только преподаватели могут создавать классы' 
      });
    }
    
    // Проверяем, что курс существует
    const course = courses.find(c => c.id === course_id);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Курс не найден' 
      });
    }
    
    // Генерируем код приглашения
    const joinCode = 'CLASS' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Создаем класс
    const newClass = {
      id: classes.length > 0 ? Math.max(...classes.map(c => c.id)) + 1 : 1,
      teacher_id: teacher_id,
      course_id: course_id,
      name: name,
      description: description,
      join_code: joinCode,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    classes.push(newClass);
    saveData(CLASSES_FILE, classes);
    
    res.json({
      success: true,
      message: 'Класс создан успешно',
      class: {
        id: newClass.id,
        name: newClass.name,
        join_code: newClass.join_code,
        course_title: course.title
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка создания класса' });
  }
});

// 8. Получить классы преподавателя
app.get('/api/teacher/:teacher_id/classes', (req, res) => {
  try {
    const { teacher_id } = req.params;
    
    const teacherClasses = classes
      .filter(c => c.teacher_id == teacher_id)
      .map(cls => {
        const course = courses.find(c => c.id === cls.course_id);
        const studentCount = classStudents.filter(cs => cs.class_id === cls.id).length;
        
        return {
          ...cls,
          course_title: course ? course.title : 'Неизвестный курс',
          student_count: studentCount
        };
      });
    
    res.json({
      success: true,
      classes: teacherClasses
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки классов' });
  }
});

// 9. Получить курсы преподавателя
app.get('/api/teacher/:teacher_id/courses', (req, res) => {
  try {
    const { teacher_id } = req.params;
    
    const teacherCourses = courses.filter(c => c.creator_id == teacher_id);
    
    // Добавляем статистику по каждому курсу
    const coursesWithStats = teacherCourses.map(course => {
      const courseClasses = classes.filter(c => c.course_id === course.id);
      const totalStudents = courseClasses.reduce((sum, cls) => {
        return sum + classStudents.filter(cs => cs.class_id === cls.id).length;
      }, 0);
      
      return {
        ...course,
        class_count: courseClasses.length,
        student_count: totalStudents,
        active_classes: courseClasses.filter(c => c.is_active).length
      };
    });
    
    res.json({
      success: true,
      courses: coursesWithStats
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки курсов' });
  }
});

// 10. Получить классы преподавателя с детальной информацией
app.get('/api/teacher/:teacher_id/classes-detailed', (req, res) => {
  try {
    const { teacher_id } = req.params;
    
    const teacherClasses = classes
      .filter(c => c.teacher_id == teacher_id)
      .map(cls => {
        const course = courses.find(c => c.id === cls.course_id);
        const students = classStudents.filter(cs => cs.class_id === cls.id);
        const activeStudents = students.filter(s => s.status === 'active');
        
        return {
          ...cls,
          course_title: course ? course.title : 'Неизвестный курс',
          course_description: course ? course.description : '',
          total_students: students.length,
          active_students: activeStudents.length,
          students: activeStudents.map(s => ({
            student_id: s.student_id,
            joined_at: s.joined_at,
            status: s.status
          }))
        };
      });
    
    res.json({
      success: true,
      classes: teacherClasses
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки классов' });
  }
});

// 11. Удалить пустой курс
app.delete('/api/courses/:course_id', (req, res) => {
  try {
    const { course_id } = req.params;
    const { teacher_id } = req.query;
    
    // Проверяем права
    const course = courses.find(c => c.id == course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Курс не найден' });
    }
    
    if (course.creator_id != teacher_id) {
      return res.status(403).json({ success: false, error: 'Нет прав на удаление этого курса' });
    }
    
    // Проверяем, есть ли классы на этом курсе
    const courseClasses = classes.filter(c => c.course_id == course_id);
    if (courseClasses.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Нельзя удалить курс, на котором есть классы. Сначала удалите все классы.' 
      });
    }
    
    // Удаляем курс
    courses = courses.filter(c => c.id != course_id);
    saveData(COURSES_FILE, courses);
    
    res.json({
      success: true,
      message: 'Курс удален успешно'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка удаления курса' });
  }
});

// 12. Удалить пустой класс
app.delete('/api/classes/:class_id', (req, res) => {
  try {
    const { class_id } = req.params;
    const { teacher_id } = req.query;
    
    // Проверяем права
    const classItem = classes.find(c => c.id == class_id);
    if (!classItem) {
      return res.status(404).json({ success: false, error: 'Класс не найден' });
    }
    
    if (classItem.teacher_id != teacher_id) {
      return res.status(403).json({ success: false, error: 'Нет прав на удаление этого класса' });
    }
    
    // Проверяем, есть ли студенты в классе
    const classStudentsCount = classStudents.filter(cs => cs.class_id == class_id).length;
    if (classStudentsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Нельзя удалить класс, в котором есть студенты' 
      });
    }
    
    // Удаляем класс
    classes = classes.filter(c => c.id != class_id);
    saveData(CLASSES_FILE, classes);
    
    res.json({
      success: true,
      message: 'Класс удален успешно'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка удаления класса' });
  }
});

// 13. Получить курс по ID
app.get('/api/courses/:course_id', (req, res) => {
  try {
    const { course_id } = req.params;
    const course = courses.find(c => c.id == course_id);
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Курс не найден' 
      });
    }
    
    res.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        duration_hours: course.duration_hours,
        creator_id: course.creator_id,
        author_name: course.author_name,
        is_public: course.is_public,
        created_at: course.created_at
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки курса' });
  }
});

// 14. Получить классы курса
app.get('/api/courses/:course_id/classes', (req, res) => {
  try {
    const { course_id } = req.params;
    
    const courseClasses = classes
      .filter(c => c.course_id == course_id)
      .map(cls => {
        const students = classStudents.filter(cs => cs.class_id === cls.id);
        const activeStudents = students.filter(s => s.status === 'active');
        
        return {
          ...cls,
          total_students: students.length,
          active_students: activeStudents.length,
          students: activeStudents.map(s => ({
            student_id: s.student_id,
            joined_at: s.joined_at,
            status: s.status
          }))
        };
      });
    
    res.json({
      success: true,
      classes: courseClasses,
      total_classes: courseClasses.length
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки классов курса' });
  }
});

// 15. Получить студентов класса
app.get('/api/classes/:class_id/students', (req, res) => {
  try {
    const { class_id } = req.params;
    
    const students = classStudents
      .filter(cs => cs.class_id == class_id && cs.status === 'active')
      .map(cs => {
        const user = users.find(u => u.id === cs.student_id);
        return {
          student_id: cs.student_id,
          name: user ? user.name : 'Неизвестный',
          email: user ? user.email : 'Неизвестный',
          avatar: user ? user.avatar : '??',
          joined_at: cs.joined_at,
          final_grade: cs.final_grade,
          status: cs.status
        };
      });
    
    const classInfo = classes.find(c => c.id == class_id);
    const courseInfo = classInfo ? courses.find(c => c.id === classInfo.course_id) : null;
    
    res.json({
      success: true,
      class: classInfo ? {
        id: classInfo.id,
        name: classInfo.name,
        description: classInfo.description,
        join_code: classInfo.join_code
      } : null,
      course: courseInfo ? {
        id: courseInfo.id,
        title: courseInfo.title
      } : null,
      students: students,
      total_students: students.length
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки студентов' });
  }
});

// 16. Проверить возможность создания класса для курса
app.get('/api/courses/:course_id/can-create-class', (req, res) => {
  try {
    const { course_id } = req.params;
    const { teacher_id } = req.query;
    
    const course = courses.find(c => c.id == course_id);
    
    if (!course) {
      return res.json({
        success: false,
        error: 'Курс не найден'
      });
    }
    
    if (course.creator_id != teacher_id) {
      return res.json({
        success: false,
        error: 'Вы не можете создавать классы для этого курса'
      });
    }
    
    res.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description
      },
      can_create: true
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка проверки' });
  }
});

// ========== ENDPOINTS ДЛЯ СТУДЕНТОВ ==========

// 17. Получить классы студента
app.get('/api/student/:student_id/classes', (req, res) => {
  try {
    const { student_id } = req.params;
    
    // Находим классы, в которых состоит студент
    const studentClasses = classStudents
      .filter(cs => cs.student_id == student_id && cs.status === 'active')
      .map(cs => {
        const classItem = classes.find(c => c.id === cs.class_id);
        if (!classItem) return null;
        
        const course = courses.find(c => c.id === classItem.course_id);
        const teacher = users.find(u => u.id === classItem.teacher_id);
        
        return {
          class_id: classItem.id,
          class_name: classItem.name,
          class_description: classItem.description,
          join_code: classItem.join_code,
          course_id: classItem.course_id,
          course_title: course ? course.title : 'Неизвестный курс',
          course_description: course ? course.description : '',
          teacher_id: classItem.teacher_id,
          teacher_name: teacher ? teacher.name : 'Неизвестный преподаватель',
          joined_at: cs.joined_at,
          final_grade: cs.final_grade,
          start_date: classItem.start_date,
          end_date: classItem.end_date,
          is_active: classItem.is_active
        };
      })
      .filter(cls => cls !== null);
    
    res.json({
      success: true,
      classes: studentClasses,
      total_classes: studentClasses.length
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки классов студента' });
  }
});

// 18. Присоединиться к классу (для уже зарегистрированных студентов)
app.post('/api/classes/:class_id/join', (req, res) => {
  try {
    const { class_id } = req.params;
    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID студента обязателен' 
      });
    }
    
    const classItem = classes.find(c => c.id == class_id && c.is_active);
    
    if (!classItem) {
      return res.json({
        success: false,
        error: 'Класс не найден или неактивен'
      });
    }
    
    // Проверяем даты класса
    const now = new Date();
    const startDate = new Date(classItem.start_date);
    const endDate = new Date(classItem.end_date);
    
    if (now < startDate) {
      return res.json({
        success: false,
        error: 'Класс еще не начался'
      });
    }
    
    if (now > endDate) {
      return res.json({
        success: false,
        error: 'Класс уже завершился'
      });
    }
    
    // Проверяем, не состоит ли уже студент в классе
    const existing = classStudents.find(cs => 
      cs.class_id == class_id && cs.student_id == student_id
    );
    
    if (existing) {
      return res.json({
        success: false,
        error: 'Вы уже состоите в этом классе'
      });
    }
    
    // Добавляем студента в класс
    const newClassStudent = {
      id: classStudents.length > 0 ? Math.max(...classStudents.map(cs => cs.id)) + 1 : 1,
      class_id: classItem.id,
      student_id: student_id,
      joined_at: new Date().toISOString(),
      status: 'active',
      final_grade: null
    };
    
    classStudents.push(newClassStudent);
    saveData(CLASS_STUDENTS_FILE, classStudents);
    
    // Получаем информацию о курсе
    const course = courses.find(c => c.id === classItem.course_id);
    const teacher = users.find(u => u.id === classItem.teacher_id);
    
    res.json({
      success: true,
      message: `Вы успешно присоединились к классу "${classItem.name}"`,
      class: {
        id: classItem.id,
        name: classItem.name,
        description: classItem.description
      },
      course: course ? {
        id: course.id,
        title: course.title,
        description: course.description
      } : null,
      teacher: teacher ? {
        id: teacher.id,
        name: teacher.name
      } : null
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка присоединения к классу' });
  }
});

// 19. Получить прогресс студента по курсу
app.get('/api/student/:student_id/course/:course_id/progress', (req, res) => {
  try {
    const { student_id, course_id } = req.params;
    
    // Проверяем, есть ли студент в классе с этим курсом
    const studentClasses = classStudents.filter(cs => 
      cs.student_id == student_id && cs.status === 'active'
    );
    
    let hasAccess = false;
    for (const cs of studentClasses) {
      const classItem = classes.find(c => c.id === cs.class_id);
      if (classItem && classItem.course_id == course_id) {
        hasAccess = true;
        break;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'У вас нет доступа к этому курсу' 
      });
    }
    
    // Здесь будет реальная логика прогресса
    // Пока заглушка
    const progress = {
      total_lessons: 12,
      completed_lessons: 5,
      completion_percentage: Math.round((5 / 12) * 100),
      total_exercises: 24,
      completed_exercises: 10,
      average_score: 85,
      last_activity: new Date().toISOString(),
      modules: [
        {
          id: 1,
          title: 'Введение в Python',
          completed: true,
          progress: 100,
          lessons: 3,
          completed_lessons: 3
        },
        {
          id: 2,
          title: 'Операторы и условия',
          completed: true,
          progress: 100,
          lessons: 4,
          completed_lessons: 4
        },
        {
          id: 3,
          title: 'Циклы и итерации',
          completed: false,
          progress: 50,
          lessons: 5,
          completed_lessons: 2
        },
        {
          id: 4,
          title: 'Функции',
          completed: false,
          progress: 0,
          lessons: 6,
          completed_lessons: 0
        }
      ]
    };
    
    res.json({
      success: true,
      progress: progress
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки прогресса' });
  }
});

// 20. Получить курсы доступные студенту
app.get('/api/student/:student_id/courses', (req, res) => {
  try {
    const { student_id } = req.params;
    
    // Находим классы студента
    const studentClasses = classStudents
      .filter(cs => cs.student_id == student_id && cs.status === 'active')
      .map(cs => classes.find(c => c.id === cs.class_id))
      .filter(cls => cls !== undefined);
    
    // Находим уникальные курсы
    const courseIds = [...new Set(studentClasses.map(cls => cls.course_id))];
    const studentCourses = courseIds.map(courseId => {
      const course = courses.find(c => c.id === courseId);
      if (!course) return null;
      
      // Находим классы студента для этого курса
      const courseClasses = studentClasses.filter(cls => cls.course_id === courseId);
      
      // Получаем прогресс
      const progress = {
        total_lessons: 12,
        completed_lessons: Math.floor(Math.random() * 12),
        completion_percentage: 0
      };
      progress.completion_percentage = Math.round((progress.completed_lessons / progress.total_lessons) * 100);
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        duration_hours: course.duration_hours,
        author_name: course.author_name,
        classes_count: courseClasses.length,
        progress: progress,
        last_accessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      };
    }).filter(course => course !== null);
    
    res.json({
      success: true,
      courses: studentCourses,
      total_courses: studentCourses.length
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки курсов студента' });
  }
});

// 21. Присоединиться по коду приглашения
app.post('/api/classes/join-by-code', (req, res) => {
  try {
    const { student_id, invite_code } = req.body;
    
    if (!student_id || !invite_code) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID студента и код приглашения обязательны' 
      });
    }
    
    const classItem = classes.find(c => c.join_code === invite_code && c.is_active);
    
    if (!classItem) {
      return res.json({
        success: false,
        error: 'Класс с таким кодом не найден'
      });
    }
    
    // Проверяем даты класса
    const now = new Date();
    const startDate = new Date(classItem.start_date);
    const endDate = new Date(classItem.end_date);
    
    if (now < startDate) {
      return res.json({
        success: false,
        error: 'Класс еще не начался'
      });
    }
    
    if (now > endDate) {
      return res.json({
        success: false,
        error: 'Класс уже завершился'
      });
    }
    
    // Проверяем, не состоит ли уже студент в классе
    const existing = classStudents.find(cs => 
      cs.class_id == classItem.id && cs.student_id == student_id
    );
    
    if (existing) {
      return res.json({
        success: false,
        error: 'Вы уже состоите в этом классе'
      });
    }
    
    // Добавляем студента в класс
    const newClassStudent = {
      id: classStudents.length > 0 ? Math.max(...classStudents.map(cs => cs.id)) + 1 : 1,
      class_id: classItem.id,
      student_id: student_id,
      joined_at: new Date().toISOString(),
      status: 'active',
      final_grade: null
    };
    
    classStudents.push(newClassStudent);
    saveData(CLASS_STUDENTS_FILE, classStudents);
    
    const course = courses.find(c => c.id === classItem.course_id);
    const teacher = users.find(u => u.id === classItem.teacher_id);
    
    res.json({
      success: true,
      message: `Вы успешно присоединились к классу "${classItem.name}"`,
      class: {
        id: classItem.id,
        name: classItem.name
      },
      course: course ? {
        id: course.id,
        title: course.title
      } : null,
      teacher: teacher ? {
        name: teacher.name
      } : null
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка присоединения' });
  }
});

// 22. Проверка приглашения
app.get('/api/invitations/check/:code', (req, res) => {
  try {
    const { code } = req.params;
    
    // Ищем класс с таким кодом
    const classItem = classes.find(c => c.join_code === code && c.is_active);
    
    if (!classItem) {
      return res.json({
        success: false,
        error: 'Приглашение не найдено или класс неактивен'
      });
    }
    
    // Проверяем даты класса
    const now = new Date();
    const startDate = new Date(classItem.start_date);
    const endDate = new Date(classItem.end_date);
    
    if (now < startDate) {
      return res.json({
        success: false,
        error: 'Класс еще не начался'
      });
    }
    
    if (now > endDate) {
      return res.json({
        success: false,
        error: 'Класс уже завершился'
      });
    }
    
    const course = courses.find(c => c.id === classItem.course_id);
    const teacher = users.find(u => u.id === classItem.teacher_id);
    
    if (!course || !teacher) {
      return res.json({
        success: false,
        error: 'Ошибка данных приглашения'
      });
    }
    
    res.json({
      success: true,
      invitation: {
        class: {
          id: classItem.id,
          name: classItem.name,
          description: classItem.description,
          start_date: classItem.start_date,
          end_date: classItem.end_date
        },
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          duration_hours: course.duration_hours
        },
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка проверки приглашения'
    });
  }
});

// ========== РЕДАКТИРОВАНИЕ КУРСОВ ==========

// 23. Обновить курс (для преподавателей)
app.put('/api/courses/:course_id', (req, res) => {
  try {
    const { course_id } = req.params;
    const { teacher_id, title, description, category, difficulty, duration_hours } = req.body;
    
    // Находим курс
    const courseIndex = courses.findIndex(c => c.id == course_id);
    
    if (courseIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Курс не найден' 
      });
    }
    
    const course = courses[courseIndex];
    
    // Проверяем права
    if (course.creator_id != teacher_id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Только создатель курса может редактировать его' 
      });
    }
    
    // Обновляем курс
    courses[courseIndex] = {
      ...course,
      title: title || course.title,
      description: description || course.description,
      category: category || course.category,
      difficulty: difficulty || course.difficulty,
      duration_hours: duration_hours || course.duration_hours,
      updated_at: new Date().toISOString()
    };
    
    saveData(COURSES_FILE, courses);
    
    res.json({
      success: true,
      message: 'Курс обновлен успешно',
      course: courses[courseIndex]
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка обновления курса' });
  }
});

// ========== РЕДАКТИРОВАНИЕ КЛАССОВ ==========

// 24. Обновить класс (для преподавателей)
app.put('/api/classes/:class_id', (req, res) => {
  try {
    const { class_id } = req.params;
    const { teacher_id, name, description, start_date, end_date, is_active } = req.body;
    
    // Находим класс
    const classIndex = classes.findIndex(c => c.id == class_id);
    
    if (classIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Класс не найден' 
      });
    }
    
    const classItem = classes[classIndex];
    
    // Проверяем права
    if (classItem.teacher_id != teacher_id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Только преподаватель класса может редактировать его' 
      });
    }
    
    // Проверяем, можно ли редактировать
    const studentCount = classStudents.filter(cs => cs.class_id == class_id && cs.status === 'active').length;
    
    // Обновляем класс
    classes[classIndex] = {
      ...classItem,
      name: name || classItem.name,
      description: description || classItem.description,
      start_date: start_date || classItem.start_date,
      end_date: end_date || classItem.end_date,
      is_active: is_active !== undefined ? is_active : classItem.is_active,
      updated_at: new Date().toISOString()
    };
    
    // Если деактивируем класс, проверяем даты
    if (is_active === false && classItem.is_active === true) {
      const now = new Date();
      const startDate = new Date(classes[classIndex].start_date);
      const endDate = new Date(classes[classIndex].end_date);
      
      if (now >= startDate && now <= endDate) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя деактивировать активный класс во время его проведения'
        });
      }
    }
    
    saveData(CLASSES_FILE, classes);
    
    res.json({
      success: true,
      message: 'Класс обновлен успешно',
      class: classes[classIndex],
      student_count: studentCount
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка обновления класса' });
  }
});

// 25. Обновить статус студента в классе (для преподавателей)
app.put('/api/classes/:class_id/students/:student_id', (req, res) => {
  try {
    const { class_id, student_id } = req.params;
    const { teacher_id, final_grade, status } = req.body;
    
    // Проверяем права преподавателя
    const classItem = classes.find(c => c.id == class_id && c.teacher_id == teacher_id);
    
    if (!classItem) {
      return res.status(403).json({ 
        success: false, 
        error: 'Только преподаватель класса может обновлять статус студентов' 
      });
    }
    
    // Находим запись о студенте в классе
    const studentIndex = classStudents.findIndex(cs => 
      cs.class_id == class_id && cs.student_id == student_id
    );
    
    if (studentIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Студент не найден в этом классе' 
      });
    }
    
    // Обновляем запись
    classStudents[studentIndex] = {
      ...classStudents[studentIndex],
      final_grade: final_grade !== undefined ? final_grade : classStudents[studentIndex].final_grade,
      status: status || classStudents[studentIndex].status,
      updated_at: new Date().toISOString()
    };
    
    saveData(CLASS_STUDENTS_FILE, classStudents);
    
    const user = users.find(u => u.id == student_id);
    
    res.json({
      success: true,
      message: 'Статус студента обновлен',
      student: {
        id: student_id,
        name: user ? user.name : 'Неизвестный',
        final_grade: classStudents[studentIndex].final_grade,
        status: classStudents[studentIndex].status
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка обновления статуса студента' });
  }
});

// Эндпоинт для сброса данных (только для разработки)
app.post('/api/debug/reset', (req, res) => {
  // Восстанавливаем начальные данные
  users = [
    {
      id: 1,
      email: 'teacher@pythonlab.ru',
      name: 'Анна Петрова',
      role: 'teacher',
      password: 'password123',
      avatar: 'АП',
      email_verified: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      email: 'student@pythonlab.ru',
      name: 'Иван Сидоров',
      role: 'student',
      password: 'password123',
      avatar: 'ИС',
      email_verified: true,
      created_at: new Date().toISOString()
    }
  ];
  
  saveAllData();
  
  res.json({
    success: true,
    message: 'Данные сброшены к начальному состоянию',
    users: users.length
  });
});

// ========== СТАТИЧЕСКИЕ ФАЙЛЫ ==========
// Раздача статических файлов
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

// Проверка существования index.html
const indexHtmlPath = path.join(FRONTEND_PATH, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.warn('⚠️ index.html не найден в frontend папке');
  
  // Создаем простую тестовую страницу
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PythonLab API работает!</title>
        <style>
          body { font-family: Arial; padding: 40px; text-align: center; }
          h1 { color: #2c82c9; }
          .user { background: #f0f0f0; padding: 10px; margin: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>✅ PythonLab Persistent Server работает!</h1>
        <p>Сервер запущен на порту ${PORT}</p>
        <h3>Зарегистрированные пользователи (${users.length}):</h3>
        ${users.map(user => `
          <div class="user">
            ${user.id}. ${user.email} (${user.name}) - ${user.role}
            <button onclick="deleteUser(${user.id})" style="margin-left: 10px; color: red;">×</button>
          </div>
        `).join('')}
        <script>
          async function deleteUser(id) {
            if (confirm('Удалить пользователя?')) {
              await fetch('/api/auth/users/' + id, { method: 'DELETE' });
              location.reload();
            }
          }
        </script>
      </body>
      </html>
    `);
  });
}

// ========== ОБРАБОТКА ОШИБОК ==========

// 404 для API
app.use('/api/*', (req, res) => {
  console.log('API endpoint not found:', req.originalUrl);
  res.status(404).json({ 
    success: false,
    error: 'API endpoint не найден',
    endpoint: req.originalUrl,
    availableEndpoints: [
      '/api/test',
      '/api/hello',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/verify',
      '/api/auth/users',
      '/api/courses',
      '/api/classes',
      '/api/teacher/:id/courses',
      '/api/teacher/:id/classes'
    ]
  });
});

// Все остальные GET запросы отправляем на index.html
app.get('*', (req, res) => {
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(404).send('index.html не найден');
  }
=======
// Присоединение к классу по коду
app.post('/api/classes/join-by-code', authenticateToken, async (req, res) => {
    try {
        const { invite_code } = req.body;
        const studentId = req.user.id;
        
        if (!invite_code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Код приглашения обязателен' 
            });
        }
        
        // Ищем класс по коду
        const classResult = await pool.query(
            `SELECT c.*, cr.title as course_title, u.name as teacher_name
             FROM classes c
             JOIN courses cr ON c.course_id = cr.id
             JOIN users u ON c.teacher_id = u.id
             WHERE c.join_code = $1 AND c.is_active = true`,
            [invite_code.toUpperCase()]
        );
        
        if (classResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Класс с таким кодом не найден или неактивен' 
            });
        }
        
        const classData = classResult.rows[0];
        
        // Проверяем, не присоединен ли уже студент
        const existingCheck = await pool.query(
            'SELECT id FROM class_students WHERE class_id = $1 AND student_id = $2',
            [classData.id, studentId]
        );
        
        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Вы уже присоединены к этому классу' 
            });
        }
        
        // Добавляем студента в класс
        await pool.query(
            'INSERT INTO class_students (class_id, student_id) VALUES ($1, $2)',
            [classData.id, studentId]
        );
        
        res.json({
            success: true,
            message: 'Вы успешно присоединились к классу',
            class: {
                id: classData.id,
                name: classData.name,
                course_title: classData.course_title,
                teacher_name: classData.teacher_name
            }
        });
        
    } catch (error) {
        console.error('Ошибка присоединения к классу:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при присоединении к классу' 
        });
    }
});

// Получение классов преподавателя
app.get('/api/teacher/:teacher_id/classes-detailed', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.params.teacher_id;
        
        if (req.user.id !== parseInt(teacherId) && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на просмотр этих классов' 
            });
        }
        
        const result = await pool.query(
            `SELECT 
                c.*,
                cr.title as course_title,
                cr.description as course_description,
                COUNT(cs.student_id) as total_students,
                COUNT(CASE WHEN cs.status = 'active' THEN 1 END) as active_students,
                c.start_date <= CURRENT_DATE AND c.end_date >= CURRENT_DATE as is_active
             FROM classes c
             JOIN courses cr ON c.course_id = cr.id
             LEFT JOIN class_students cs ON c.id = cs.class_id
             WHERE c.teacher_id = $1
             GROUP BY c.id, cr.title, cr.description
             ORDER BY c.created_at DESC`,
            [teacherId]
        );
        
        res.json({
            success: true,
            classes: result.rows
        });
        
    } catch (error) {
        console.error('Ошибка получения классов преподавателя:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении классов' 
        });
    }
});

// Получение студентов класса
app.get('/api/classes/:class_id/students', authenticateToken, async (req, res) => {
    try {
        const classId = req.params.class_id;
        
        // Проверяем права доступа
        const classCheck = await pool.query(
            'SELECT teacher_id FROM classes WHERE id = $1',
            [classId]
        );
        
        if (classCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Класс не найден' 
            });
        }
        
        if (classCheck.rows[0].teacher_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на просмотр студентов этого класса' 
            });
        }
        
        const result = await pool.query(
            `SELECT 
                cs.*,
                u.id as student_id,
                u.name,
                u.email,
                cs.joined_at,
                cs.status,
                cs.final_grade
             FROM class_students cs
             JOIN users u ON cs.student_id = u.id
             WHERE cs.class_id = $1
             ORDER BY u.name`,
            [classId]
        );
        
        // Получаем информацию о классе и курсе
        const classInfoResult = await pool.query(
            `SELECT c.*, cr.title as course_title
             FROM classes c
             JOIN courses cr ON c.course_id = cr.id
             WHERE c.id = $1`,
            [classId]
        );
        
        res.json({
            success: true,
            class: classInfoResult.rows[0],
            students: result.rows,
            total_students: result.rows.length
        });
        
    } catch (error) {
        console.error('Ошибка получения студентов:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении студентов' 
        });
    }
});

// ========== СТУДЕНТЫ ==========

// Курсы студента
app.get('/api/student/:student_id/courses', authenticateToken, async (req, res) => {
    try {
        const studentId = req.params.student_id;
        
        if (req.user.id !== parseInt(studentId) && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на просмотр этих курсов' 
            });
        }
        
        const result = await pool.query(
            `SELECT DISTINCT
                c.*,
                u.name as author_name,
                (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
                (SELECT COUNT(*) FROM progress p 
                 JOIN lessons l ON p.lesson_id = l.id 
                 WHERE l.course_id = c.id AND p.student_id = $1 AND p.completed = true) as completed_lessons
             FROM courses c
             JOIN users u ON c.teacher_id = u.id
             JOIN classes cl ON c.id = cl.course_id
             JOIN class_students cs ON cl.id = cs.class_id
             WHERE cs.student_id = $1 AND c.status = 'published'
             ORDER BY c.title`,
            [studentId]
        );
        
        // Добавляем прогресс
        const coursesWithProgress = result.rows.map(course => {
            const total = course.total_lessons || 0;
            const completed = course.completed_lessons || 0;
            return {
                ...course,
                progress: {
                    total_lessons: total,
                    completed_lessons: completed,
                    completion_percentage: total > 0 ? Math.round((completed / total) * 100) : 0
                }
            };
        });
        
        res.json({
            success: true,
            courses: coursesWithProgress
        });
        
    } catch (error) {
        console.error('Ошибка получения курсов студента:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении курсов' 
        });
    }
});

// Классы студента
app.get('/api/student/:student_id/classes', authenticateToken, async (req, res) => {
    try {
        const studentId = req.params.student_id;
        
        if (req.user.id !== parseInt(studentId) && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Нет прав на просмотр этих классов' 
            });
        }
        
        const result = await pool.query(
            `SELECT 
                c.id as class_id,
                c.name as class_name,
                c.description as class_description,
                c.start_date,
                c.end_date,
                c.join_code,
                cr.id as course_id,
                cr.title as course_title,
                u.id as teacher_id,
                u.name as teacher_name,
                cs.joined_at,
                cs.status,
                cs.final_grade,
                CURRENT_DATE BETWEEN c.start_date AND c.end_date as is_active
             FROM class_students cs
             JOIN classes c ON cs.class_id = c.id
             JOIN courses cr ON c.course_id = cr.id
             JOIN users u ON c.teacher_id = u.id
             WHERE cs.student_id = $1
             ORDER BY c.start_date DESC`,
            [studentId]
        );
        
        res.json({
            success: true,
            classes: result.rows
        });
        
    } catch (error) {
        console.error('Ошибка получения классов студента:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при получении классов' 
        });
    }
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Обработка приглашения
async function handleInvitation(studentId, inviteCode) {
    const classResult = await pool.query(
        'SELECT id FROM classes WHERE join_code = $1 AND is_active = true',
        [inviteCode.toUpperCase()]
    );
    
    if (classResult.rows.length > 0) {
        const classId = classResult.rows[0].id;
        
        await pool.query(
            'INSERT INTO class_students (class_id, student_id) VALUES ($1, $2)',
            [classId, studentId]
        );
        
        return true;
    }
    
    return false;
}

// Генерация кода приглашения
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Обновление прогресса студента
async function updateStudentProgress(studentId, taskId, score) {
    try {
        // Находим урок по задаче
        const lessonResult = await pool.query(
            'SELECT lesson_id FROM tasks WHERE id = $1',
            [taskId]
        );
        
        if (lessonResult.rows.length === 0) return;
        
        const lessonId = lessonResult.rows[0].lesson_id;
        
        // Обновляем или создаем запись о прогрессе
        await pool.query(
            `INSERT INTO progress (student_id, lesson_id, completed, last_score, last_accessed)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             ON CONFLICT (student_id, lesson_id) 
             DO UPDATE SET 
                completed = EXCLUDED.completed,
                last_score = EXCLUDED.last_score,
                last_accessed = EXCLUDED.last_accessed`,
            [studentId, lessonId, score >= 60, score]
        );
        
    } catch (error) {
        console.error('Ошибка обновления прогресса:', error);
    }
}

// Создание недостающих таблиц (для разработки)
async function initializeDatabase() {
    try {
        const tables = [
            // Таблица версий уроков (если не существует)
            `CREATE TABLE IF NOT EXISTS lesson_versions (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id),
                title VARCHAR(200) NOT NULL,
                content TEXT,
                version INTEGER,
                teacher_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Таблица прогресса
            `CREATE TABLE IF NOT EXISTS progress (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES users(id),
                lesson_id INTEGER REFERENCES lessons(id),
                completed BOOLEAN DEFAULT false,
                last_score INTEGER,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, lesson_id)
            )`,
            
            // Таблица классов
            `CREATE TABLE IF NOT EXISTS classes (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id),
                teacher_id INTEGER REFERENCES users(id),
                name VARCHAR(200) NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                join_code VARCHAR(20) UNIQUE,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Таблица студентов классов
            `CREATE TABLE IF NOT EXISTS class_students (
                id SERIAL PRIMARY KEY,
                class_id INTEGER REFERENCES classes(id),
                student_id INTEGER REFERENCES users(id),
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                final_grade INTEGER,
                UNIQUE(class_id, student_id)
            )`
        ];
        
        for (const tableSql of tables) {
            try {
                await pool.query(tableSql);
            } catch (err) {
                console.log('Таблица уже существует или ошибка:', err.message);
            }
        }
        
        console.log('✅ База данных инициализирована');
        
    } catch (error) {
        console.error('Ошибка инициализации базы данных:', error);
    }
}

// Обработка 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Эндпоинт не найден'
    });
>>>>>>> a3f21f6415954d2d231aa65722fbbb6ba911b802
});

// Обработка ошибок
app.use((err, req, res, next) => {
<<<<<<< HEAD
  console.error('❌ Ошибка сервера:', err);
  res.status(500).json({ 
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ========== ЗАПУСК СЕРВЕРА ==========

app.listen(PORT, () => {
  console.log(`
🚀 ================================================
✅ PYTHONLAB PERSISTENT SERVER ЗАПУЩЕН!
📡 Порт: ${PORT}
🌐 Главная страница: http://localhost:${PORT}
📊 API тест: http://localhost:${PORT}/api/test

👨‍🏫 ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ (всегда доступны):
  Преподаватель: teacher@pythonlab.ru / password123
  Студент: student@pythonlab.ru / password123

📁 ДАННЫЕ СОХРАНЯЮТСЯ В: ${DATA_DIR}
👥 ЗАРЕГИСТРИРОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ: ${users.length}

🔄 АВТОСОХРАНЕНИЕ: каждые 30 секунд
🗑️  УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ: DELETE /api/auth/users/{id}
================================================
  `);
=======
    console.error('Необработанная ошибка:', err);
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Запуск сервера и инициализация БД
app.listen(port, async () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    
    // Инициализируем недостающие таблицы
    await initializeDatabase();
    
    console.log(`📚 API доступен по адресу: http://localhost:${port}/api`);
    console.log(`👨‍🏫 Тестовые пользователи:`);
    console.log(`   Преподаватель: teacher@pythonlab.ru / password123`);
    console.log(`   Студент: student@pythonlab.ru / password123`);
>>>>>>> a3f21f6415954d2d231aa65722fbbb6ba911b802
});