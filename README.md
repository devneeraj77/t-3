# Personal Library — The Athenaeum Archive

A full-stack JavaScript application built for the **freeCodeCamp Quality Assurance Certification** challenge: [Personal Library](https://personal-library.freecodecamp.rocks/).

Features a **Classic Library / Athenaeum UI** aesthetic (parchment vellum, deep mahogany, and gilded gold accents) while fully complying with all FreeCodeCamp testing suites and API contracts.

---

## 🏛️ Features & Architecture

- **Classic Reading Room UI**:
  - Archival volume shelves with real-time acquisition and deletion
  - Live title search filter and statistics counters
  - Interactive Reading Room to inspect volume marginalia and append scholarly annotations
  - Gilded badges, parchment commentary cards, and toast notifications
- **Interactive Scriptorium & Workbench**:
  - Canonical FreeCodeCamp test forms (`/api/books` and `/api/books/:id`)
  - Live REST API console to send asynchronous requests and inspect JSON responses
- **Full QA Verification Panel**:
  - Live test runner report fetching test results directly from `/_api/get-tests?type=functional`

---

## 🛠️ API Endpoints

| Method | Endpoint | Description | Expected Response / Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/books` | Add a new book volume | `{ _id, title }` or `missing required field title` |
| `GET` | `/api/books` | Retrieve all archived books | `[{ _id, title, commentcount }]` |
| `GET` | `/api/books/:id` | Retrieve single book by ID | `{ _id, title, comments: [...] }` or `no book exists` |
| `POST` | `/api/books/:id` | Append comment to a book | `{ _id, title, comments: [...] }`, `missing required field comment`, or `no book exists` |
| `DELETE` | `/api/books/:id` | Delete a single book | `delete successful` or `no book exists` |
| `DELETE` | `/api/books` | Purge entire library collection | `complete delete successful` |

---

## 🧪 Functional Tests (10/10 Passing)

All required functional tests are implemented using Mocha and Chai in [`tests/2_functional-tests.js`](file:///workspaces/t-3/tests/2_functional-tests.js):

1. `POST /api/books` with title => create book object
2. `POST /api/books` with no title given => `missing required field title`
3. `GET /api/books` => array of books with `commentcount`
4. `GET /api/books/[id]` with id not in db => `no book exists`
5. `GET /api/books/[id]` with valid id in db => book object with comments array
6. `POST /api/books/[id]` with comment => add comment and return book object
7. `POST /api/books/[id]` without comment field => `missing required field comment`
8. `POST /api/books/[id]` with comment, id not in db => `no book exists`
9. `DELETE /api/books/[id]` with valid id in db => `delete successful`
10. `DELETE /api/books/[id]` with id not in db => `no book exists`

---

## 🚀 Getting Started

### 1. Environment Configuration
Create or edit `.env` in the root directory:
```env
DB=mongodb://127.0.0.1:27017/fccpersonallib
NODE_ENV=test
PORT=3000
```

### 2. Run MongoDB
Using Docker:
```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

### 3. Install & Start
```bash
npm install
npm start
```

Visit `http://localhost:3000` to view the application. When `NODE_ENV=test`, the automated test runner executes on server startup and test results are served at `/_api/get-tests?type=functional`.
