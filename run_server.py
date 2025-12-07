# run_server.py
import http.server
import socketserver
import json
import os
from datetime import datetime
import hashlib
import base64

PORT = 3001
API_BASE = "http://localhost:3001"

# Простая "база данных" в памяти
users_db = {
    "teacher@pythonlab.ru": {
        "id": 1,
        "name": "Преподаватель Петров",
        "email": "teacher@pythonlab.ru",
        "password": "password123",  # В реальности нужно хешировать
        "role": "teacher"
    },
    "student@pythonlab.ru": {
        "id": 2,
        "name": "Студент Иванов",
        "email": "student@pythonlab.ru",
        "password": "password123",
        "role": "student"
    }
}

tokens = {}
courses = []
lessons = []
tasks = []

class PythonLabHandler(http.server.BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            self.serve_static_file()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_post()
        else:
            self.send_error(404)
    
    def serve_static_file(self):
        """Serve static files from frontend folder"""
        try:
            if self.path == '/':
                filepath = 'frontend/index.html'
            else:
                filepath = 'frontend' + self.path
            
            if not os.path.exists(filepath):
                filepath = 'frontend/index.html'
            
            with open(filepath, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            
            # Set content type
            if filepath.endswith('.html'):
                self.send_header('Content-Type', 'text/html; charset=utf-8')
            elif filepath.endswith('.css'):
                self.send_header('Content-Type', 'text/css')
            elif filepath.endswith('.js'):
                self.send_header('Content-Type', 'application/javascript')
            elif filepath.endswith('.png'):
                self.send_header('Content-Type', 'image/png')
            elif filepath.endswith('.jpg') or filepath.endswith('.jpeg'):
                self.send_header('Content-Type', 'image/jpeg')
            else:
                self.send_header('Content-Type', 'text/plain')
            
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            self.send_error(404, f"File not found: {str(e)}")
    
    def handle_api_get(self):
        """Handle API GET requests"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/api/health':
            response = {"success": True, "message": "PythonLab работает!"}
        
        elif self.path == '/api/courses':
            response = {
                "success": True,
                "courses": [
                    {
                        "id": 1,
                        "title": "Python Базовый",
                        "description": "Введение в программирование на Python для гуманитариев",
                        "category": "programming",
                        "difficulty": "beginner",
                        "duration_hours": 60,
                        "teacher_id": 1,
                        "teacher_name": "Преподаватель Петров",
                        "student_count": 10,
                        "lesson_count": 10
                    }
                ]
            }
        
        else:
            response = {"success": False, "error": "API endpoint не найден"}
        
        self.wfile.write(json.dumps(response).encode())
    
    def handle_api_post(self):
        """Handle API POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode())
        except:
            data = {}
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/api/auth/login':
            response = self.handle_login(data)
        
        elif self.path == '/api/auth/register':
            response = self.handle_register(data)
        
        elif self.path == '/api/auth/verify':
            response = self.handle_verify()
        
        elif self.path == '/api/courses':
            response = self.handle_create_course(data)
        
        else:
            response = {"success": False, "error": "API endpoint не найден"}
        
        self.wfile.write(json.dumps(response).encode())
    
    def handle_login(self, data):
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        if email in users_db and users_db[email]['password'] == password:
            user = users_db[email].copy()
            del user['password']
            
            # Генерируем простой токен
            token = base64.b64encode(f"{email}:{datetime.now().timestamp()}".encode()).decode()
            tokens[token] = user
            
            return {
                "success": True,
                "user": user,
                "token": token
            }
        else:
            return {
                "success": False,
                "error": "Неверный email или пароль"
            }
    
    def handle_register(self, data):
        name = data.get('name', '')
        email = data.get('email', '').lower()
        password = data.get('password', '')
        role = data.get('role', 'student')
        
        if email in users_db:
            return {"success": False, "error": "Пользователь уже существует"}
        
        user_id = len(users_db) + 1
        users_db[email] = {
            "id": user_id,
            "name": name,
            "email": email,
            "password": password,
            "role": role
        }
        
        user = users_db[email].copy()
        del user['password']
        
        return {
            "success": True,
            "message": "Регистрация успешна",
            "user": user
        }
    
    def handle_verify(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            if token in tokens:
                return {"success": True, "user": tokens[token]}
        
        return {"success": False, "error": "Недействительный токен"}
    
    def handle_create_course(self, data):
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return {"success": False, "error": "Требуется авторизация"}
        
        token = auth_header[7:]
        if token not in tokens or tokens[token]['role'] != 'teacher':
            return {"success": False, "error": "Только преподаватели могут создавать курсы"}
        
        course_id = len(courses) + 1
        course = {
            "id": course_id,
            "title": data.get('title', 'Новый курс'),
            "description": data.get('description', ''),
            "teacher_id": tokens[token]['id'],
            "created_at": datetime.now().isoformat()
        }
        courses.append(course)
        
        return {"success": True, "course": course}

def main():
    with socketserver.TCPServer(("", PORT), PythonLabHandler) as httpd:
        print(f"🚀 PythonLab сервер запущен на http://localhost:{PORT}")
        print(f"📚 Откройте: http://localhost:{PORT}/index.html")
        print("👨‍🏫 Тестовые пользователи:")
        print("   Преподаватель: teacher@pythonlab.ru / password123")
        print("   Студент: student@pythonlab.ru / password123")
        print("\nДля остановки нажмите Ctrl+C")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Сервер остановлен")

if __name__ == "__main__":
    main()