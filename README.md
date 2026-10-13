# Personal Library — Next.js App Router & TypeScript

A full-stack application built for the **freeCodeCamp Quality Assurance Certification** challenge: [Personal Library](https://personal-library.freecodecamp.rocks/), converted to **Next.js App Router with TypeScript**.

Features an **Enterprise Professional UI** (Obsidian Slate, Cobalt Blue, Platinum, and curated book palettes) while fully maintaining 100% compliance with all FreeCodeCamp testing suites, element ID contracts, and API routes.

---

## 🏛️ Next.js App Router Architecture

- **`app/api/books/route.ts`**: Route Handler for `GET`, `POST`, and `DELETE` on `/api/books`.
- **`app/api/books/[id]/route.ts`**: Route Handler for `GET`, `POST`, and `DELETE` on `/api/books/:id` (using Next.js async `params`).
- **`app/%5Fapi/get-tests/route.ts`**: Route Handler for `/_api/get-tests` serving live functional test results.
- **`app/%5Fapi/app-info/route.ts`**: Route Handler for `/_api/app-info`.
- **`app/page.tsx`**: Interactive React client component with dark/light themes, search filtering, book catalog, reading room, REST API console, and live test report viewer.
- **`app/layout.tsx`**: Root layout with metadata and ambient atmospheric backdrops.
- **`app/globals.css`**: Professional corporate design system styles.
- **`lib/db.ts`**: Cached singleton Mongoose connection utility for Next.js.
- **`lib/parseBody.ts`**: Request body parser supporting JSON, `multipart/form-data`, and `x-www-form-urlencoded`.
- **`models/Book.ts`**: TypeScript Mongoose model for books.

---

## 🛠️ API Endpoints

| Method | Endpoint | Description | Response / Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/books` | Create a new book volume | `{ _id, title }` or `missing required field title` |
| `GET` | `/api/books` | Retrieve all archived books | `[{ _id, title, commentcount }]` |
| `GET` | `/api/books/:id` | Retrieve single book by ID | `{ _id, title, comments: [...] }` or `no book exists` |
| `POST` | `/api/books/:id` | Add comment to a book | `{ _id, title, comments: [...] }`, `missing required field comment`, or `no book exists` |
| `DELETE` | `/api/books/:id` | Delete a single book | `delete successful` or `no book exists` |
| `DELETE` | `/api/books` | Purge entire library collection | `complete delete successful` |

---

## 🧪 Functional Tests (10/10 Passing)

All required functional tests are implemented and passing:

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

## 🚀 Running the Next.js Application

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

### 3. Build & Run
```bash
npm run build
npm start
```
Or for local development:
```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.
