const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); // Middleware для обработки JSON-запросов

// Пути к файлам данных и логов
const DATA_FILE = path.join(__dirname, 'books.json');
const LOG_FILE = path.join(__dirname, 'requests.log');

// Middleware для логирования запросов
app.use((req, res, next) => {
  const logEntry = `[${new Date().toISOString()}] ${res.statusCode} ${req.method} ${req.url}\n`;
  console.log(logEntry)
  fs.appendFileSync(LOG_FILE, logEntry);
  next();
});

// Функция для чтения данных из JSON-файла
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Функция для записи данных в JSON-файл
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Валидация данных
function validateBook(book) {
  if (!book.title || typeof book.title !== 'string' || book.title.trim() === '') {
    return false;
  }
  if (!book.author || typeof book.author !== 'string' || book.author.trim() === '') {
    return false;
  }
  if (!book.year || typeof book.year !== 'number' || book.year < 1800 || book.year > new Date().getFullYear()) {
    return false;
  }
  return true;
}

// 2.1. GET-запрос для получения списка всех книг
app.get('/books', (req, res) => {
  const books = readData();
  res.json(books);
});

// 2.2. POST-запрос для добавления новой книги
app.post('/books', (req, res) => {
  const books = readData();
  const newBook = req.body;

  if (!validateBook(newBook)) {
    return res.status(400).json({ error: 'Некорректные данные книги' });
  }

  newBook.id = Date.now().toString(); // Уникальный ID
  books.push(newBook);
  writeData(books);

  res.status(201).json(newBook);
});

// 2.3. PUT-запрос для обновления книги
app.put('/books/:id', (req, res) => {
  const books = readData();
  const { id } = req.params;
  const updatedBook = req.body;

  if (!validateBook(updatedBook)) {
    return res.status(400).json({ error: 'Некорректные данные книги' });
  }

  const index = books.findIndex((book) => book.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }

  updatedBook.id = id; // Убедимся, что ID не изменился
  books[index] = updatedBook;
  writeData(books);

  res.json(updatedBook);
});

// 2.4. DELETE-запрос для удаления книги
app.delete('/books/:id', (req, res) => {
  const books = readData();
  const { id } = req.params;

  const index = books.findIndex((book) => book.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }

  books.splice(index, 1);
  writeData(books);

  res.status(204).send();
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});