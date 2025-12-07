-- Удаление существующих таблиц (осторожно!)
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS lesson_versions CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS class_students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Курсы
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_hours INTEGER,
    teacher_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft',
    access_level VARCHAR(20) DEFAULT 'public',
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Уроки
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    module_number INTEGER,
    title VARCHAR(200) NOT NULL,
    order_number INTEGER,
    duration_hours DECIMAL(4,2),
    lesson_type VARCHAR(20),
    content TEXT,
    learning_objectives TEXT,
    additional_materials TEXT,
    teacher_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft',
    access_level VARCHAR(20) DEFAULT 'public',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Версии уроков
CREATE TABLE lesson_versions (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    version INTEGER,
    teacher_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Задачи
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    points INTEGER DEFAULT 10,
    expected_result TEXT,
    starter_code TEXT,
    hints TEXT,
    solution TEXT,
    tests TEXT,
    teacher_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Решения студентов
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    student_id INTEGER REFERENCES users(id),
    code TEXT,
    language VARCHAR(20) DEFAULT 'python',
    result JSONB,
    score INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluated_at TIMESTAMP
);

-- Прогресс студентов
CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    lesson_id INTEGER REFERENCES lessons(id),
    completed BOOLEAN DEFAULT false,
    last_score INTEGER,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lesson_id)
);

-- Классы
CREATE TABLE classes (
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
);

-- Студенты классов
CREATE TABLE class_students (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    student_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    final_grade INTEGER,
    UNIQUE(class_id, student_id)
);

-- Создание индексов для производительности
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_tasks_lesson ON tasks(lesson_id);
CREATE INDEX idx_submissions_task ON submissions(task_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_classes_course ON classes(course_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_class_students_class ON class_students(class_id);
CREATE INDEX idx_class_students_student ON class_students(student_id);

-- Вставка тестовых данных
INSERT INTO users (name, email, password_hash, role) VALUES
('Преподаватель Петров', 'teacher@pythonlab.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye.k7.8ZJ6Kv.9Qp.ZZ.0Vv5jq5QlG/6W', 'teacher'),
('Студент Иванов', 'student@pythonlab.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye.k7.8ZJ6Kv.9Qp.ZZ.0Vv5jq5QlG/6W', 'student');

-- Пароль для обоих: password123