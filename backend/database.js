// backend/database.js (полная версия)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'pythonlab.db');
        console.log('📊 Путь к БД:', this.dbPath);
        
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Ошибка подключения к БД:', err.message);
            } else {
                console.log('✅ Подключено к SQLite базе данных');
                this.initDatabase();
            }
        });
    }

    initDatabase() {
        const tables = [
            // Пользователи
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                avatar TEXT,
                role TEXT DEFAULT 'student',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Модули
            `CREATE TABLE IF NOT EXISTS modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                duration TEXT,
                order_index INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Темы модулей
            `CREATE TABLE IF NOT EXISTS module_topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module_id INTEGER,
                topic TEXT NOT NULL,
                FOREIGN KEY (module_id) REFERENCES modules(id)
            )`,
            
            // Прогресс пользователя по модулям
            `CREATE TABLE IF NOT EXISTS user_module_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                module_id INTEGER,
                status TEXT DEFAULT 'not-started',
                progress INTEGER DEFAULT 0,
                completed_exercises INTEGER DEFAULT 0,
                started_at DATETIME,
                completed_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (module_id) REFERENCES modules(id),
                UNIQUE(user_id, module_id)
            )`,
            
            // Упражнения
            `CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module_id INTEGER,
                title TEXT NOT NULL,
                description TEXT,
                difficulty TEXT DEFAULT 'легкая',
                solution TEXT,
                order_index INTEGER,
                FOREIGN KEY (module_id) REFERENCES modules(id)
            )`,
            
            // Прогресс по упражнениям
            `CREATE TABLE IF NOT EXISTS user_exercise_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                exercise_id INTEGER,
                completed BOOLEAN DEFAULT 0,
                user_code TEXT,
                attempts INTEGER DEFAULT 0,
                completed_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (exercise_id) REFERENCES exercises(id),
                UNIQUE(user_id, exercise_id)
            )`,
            
            // Группы
            `CREATE TABLE IF NOT EXISTS study_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                creator_id INTEGER,
                members_count INTEGER DEFAULT 1,
                active_members INTEGER DEFAULT 1,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id)
            )`,
            
            // Участники групп
            `CREATE TABLE IF NOT EXISTS group_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER,
                user_id INTEGER,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (group_id) REFERENCES study_groups(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(group_id, user_id)
            )`,
            
            // Уведомления
            `CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT NOT NULL,
                message TEXT,
                type TEXT DEFAULT 'info',
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`
        ];

        // Создаем таблицы
        const createTable = (sql) => {
            return new Promise((resolve, reject) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error('❌ Ошибка создания таблицы:', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        };

        // Создаем все таблицы последовательно
        Promise.all(tables.map(createTable))
            .then(() => {
                console.log('✅ Все таблицы созданы/проверены');
                return this.seedInitialData();
            })
            .then(() => {
                console.log('✅ Начальные данные добавлены');
            })
            .catch(err => {
                console.error('❌ Ошибка инициализации БД:', err);
            });
    }

    async seedInitialData() {
        // Проверяем, есть ли уже модули
        const count = await this.get("SELECT COUNT(*) as count FROM modules");
        
        if (count.count === 0) {
            console.log('📥 Добавляем начальные данные...');
            await this.insertAllInitialData();
        } else {
            console.log(`✅ В БД уже есть ${count.count} модулей`);
        }
    }

    async insertAllInitialData() {
        // Создаем тестового пользователя
        await this.run(
            `INSERT INTO users (name, email, avatar, role) VALUES (?, ?, ?, ?)`,
            ['Сергей Иванов', 'student@university.edu', 'СИ', 'student']
        );

        // Добавляем все 12 модулей
        const modules = this.getInitialModules();
        
        for (const module of modules) {
            const result = await this.run(
                `INSERT INTO modules (title, description, duration, order_index) VALUES (?, ?, ?, ?)`,
                [module.title, module.description, module.duration, module.order_index]
            );
            
            const moduleId = result.id;
            
            // Добавляем темы
            for (const topic of module.topics) {
                await this.run(
                    `INSERT INTO module_topics (module_id, topic) VALUES (?, ?)`,
                    [moduleId, topic]
                );
            }
            
            // Добавляем упражнения
            const exercises = this.getModuleExercises(module.order_index);
            for (const [index, exercise] of exercises.entries()) {
                await this.run(
                    `INSERT INTO exercises (module_id, title, description, difficulty, solution, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
                    [moduleId, exercise.title, exercise.description, exercise.difficulty, exercise.solution, index + 1]
                );
            }
            
            console.log(`✅ Добавлен модуль: ${module.title} с ${module.topics.length} темами и ${exercises.length} упражнениями`);
        }

        // Создаем группы
        await this.run(
            `INSERT INTO study_groups (name, description, creator_id) VALUES (?, ?, ?)`,
            ['Python для начинающих', 'Группа для новичков в программировании', 1]
        );
        
        await this.run(
            `INSERT INTO study_groups (name, description, creator_id) VALUES (?, ?, ?)`,
            ['Алгоритмы и структуры данных', 'Изучаем сложные темы вместе', 1]
        );
        
        // Добавляем уведомления
        await this.run(
            `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
            [1, 'Добро пожаловать в PythonLab!', 'Начните с первого модуля "Введение в Python"', 'info']
        );
        
        // Инициализируем прогресс для пользователя
        await this.initializeUserProgress(1);
    }

    async initializeUserProgress(userId) {
        const modules = await this.query('SELECT id FROM modules');
        
        for (const module of modules) {
            await this.run(
                `INSERT OR IGNORE INTO user_module_progress (user_id, module_id) VALUES (?, ?)`,
                [userId, module.id]
            );
        }
        
        // Отмечаем первые 2 модуля как завершенные
        await this.run(
            `UPDATE user_module_progress SET status = 'completed', progress = 100, completed_exercises = 4 WHERE user_id = ? AND module_id = 1`,
            [userId]
        );
        
        await this.run(
            `UPDATE user_module_progress SET status = 'completed', progress = 100, completed_exercises = 5 WHERE user_id = ? AND module_id = 2`,
            [userId]
        );
        
        // Третий модуль в процессе
        await this.run(
            `UPDATE user_module_progress SET status = 'in-progress', progress = 60, completed_exercises = 2 WHERE user_id = ? AND module_id = 3`,
            [userId]
        );
        
        console.log(`✅ Прогресс инициализирован для пользователя ${userId}`);
    }

    getInitialModules() {
        return [
            {
                title: "Введение в Python",
                description: "Основные концепции программирования, установка Python, первая программа",
                duration: "5 часов",
                order_index: 1,
                topics: ["Установка Python", "Первая программа", "Переменные", "Типы данных", "Комментарии"]
            },
            {
                title: "Операторы и условия",
                description: "Арифметические операторы, условные конструкции, логические выражения",
                duration: "6 часов",
                order_index: 2,
                topics: ["Арифметические операторы", "Операторы сравнения", "Логические операторы", "Условные конструкции if/elif/else", "Тернарный оператор"]
            },
            {
                title: "Циклы и итерации",
                description: "Циклы for и while, работа с последовательностями",
                duration: "7 часов",
                order_index: 3,
                topics: ["Цикл for", "Цикл while", "Функция range()", "Операторы break и continue", "Вложенные циклы"]
            },
            {
                title: "Функции",
                description: "Создание и использование функций, параметры, возвращаемые значения",
                duration: "8 часов",
                order_index: 4,
                topics: ["Определение функций", "Параметры и аргументы", "Возврат значений", "Область видимости", "Рекурсия"]
            },
            {
                title: "Работа со строками",
                description: "Строковые операции, методы, форматирование",
                duration: "5 часов",
                order_index: 5,
                topics: ["Строковые методы", "Индексация и срезы", "Форматирование строк", "Строковые операции", "Регулярные выражения"]
            },
            {
                title: "Списки и кортежи",
                description: "Работа с коллекциями, методы списков, кортежи",
                duration: "6 часов",
                order_index: 6,
                topics: ["Создание списков", "Методы списков", "Кортежи", "Списковые включения", "Сортировка"]
            },
            {
                title: "Словари и множества",
                description: "Хеш-таблицы, словари, множества, операции",
                duration: "7 часов",
                order_index: 7,
                topics: ["Создание словарей", "Методы словарей", "Множества", "Операции с множествами", "Генераторы словарей"]
            },
            {
                title: "Работа с файлами",
                description: "Чтение и запись файлов, обработка исключений",
                duration: "6 часов",
                order_index: 8,
                topics: ["Открытие файлов", "Чтение файлов", "Запись в файлы", "Контекстные менеджеры", "Обработка исключений"]
            },
            {
                title: "Модули и пакеты",
                description: "Импорт модулей, создание собственных модулей, пакеты",
                duration: "5 часов",
                order_index: 9,
                topics: ["Импорт модулей", "Стандартные модули", "Создание модулей", "Пакеты", "Установка пакетов"]
            },
            {
                title: "Объектно-ориентированное программирование",
                description: "Классы, объекты, наследование, полиморфизм",
                duration: "10 часов",
                order_index: 10,
                topics: ["Классы и объекты", "Наследование", "Полиморфизм", "Магические методы", "Декораторы классов"]
            },
            {
                title: "Основы анализа данных",
                description: "Введение в Pandas, NumPy, визуализация данных",
                duration: "12 часов",
                order_index: 11,
                topics: ["NumPy массивы", "Pandas DataFrame", "Визуализация с Matplotlib", "Анализ данных", "Очистка данных"]
            },
            {
                title: "Финальный проект",
                description: "Разработка проекта с применением полученных знаний",
                duration: "15 часов",
                order_index: 12,
                topics: ["Постановка задачи", "Проектирование", "Реализация", "Тестирование", "Документация"]
            }
        ];
    }

    getModuleExercises(moduleNumber) {
        const exercisesMap = {
            1: [
                {
                    title: "Первая программа на Python",
                    description: "Напишите программу, которая выводит 'Привет, мир!' и ваше имя",
                    difficulty: "легкая",
                    solution: `print("Привет, мир!")
print("Меня зовут Сергей")`
                },
                {
                    title: "Калькулятор возраста",
                    description: "Напишите программу, которая запрашивает год рождения и вычисляет возраст",
                    difficulty: "легкая",
                    solution: `год_рождения = int(input("Введите год рождения: "))
текущий_год = 2024
возраст = текущий_год - год_рождения
print(f"Ваш возраст: {возраст} лет")`
                }
            ],
            2: [
                {
                    title: "Калькулятор",
                    description: "Создайте простой калькулятор, который выполняет основные арифметические операции",
                    difficulty: "легкая",
                    solution: `a = float(input("Введите первое число: "))
b = float(input("Введите второе число: "))

print(f"{a} + {b} = {a + b}")
print(f"{a} - {b} = {a - b}")
print(f"{a} * {b} = {a * b}")
print(f"{a} / {b} = {a / b}")`
                },
                {
                    title: "Проверка четности",
                    description: "Напишите программу, которая определяет, является ли число четным или нечетным",
                    difficulty: "легкая",
                    solution: `число = int(input("Введите число: "))

if число % 2 == 0:
    print(f"Число {число} четное")
else:
    print(f"Число {число} нечетное")`
                }
            ],
            3: [
                {
                    title: "Таблица умножения",
                    description: "Выведите таблицу умножения для заданного числа",
                    difficulty: "средняя",
                    solution: `number = int(input("Введите число: "))

print(f"Таблица умножения для {number}:")
for i in range(1, 11):
    print(f"{number} × {i} = {number * i}")`
                },
                {
                    title: "Поиск простых чисел",
                    description: "Найдите все простые числа в заданном диапазоне",
                    difficulty: "сложная",
                    solution: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

start = int(input("Начало диапазона: "))
end = int(input("Конец диапазона: "))

print(f"Простые числа от {start} до {end}:")
for num in range(start, end + 1):
    if is_prime(num):
        print(num, end=" ")`
                }
            ]
        };
        
        return exercisesMap[moduleNumber] || [
            {
                title: "Пример упражнения",
                description: "Это пример упражнения для модуля",
                difficulty: "легкая",
                solution: "print('Пример решения')"
            }
        ];
    }

    // Методы для работы с БД
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
}

module.exports = new Database();