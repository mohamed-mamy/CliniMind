# CliniMind Frontend (React + Vite)

Integrated presentation layer for CliniMind clinic management system, built using React 19, Vite, and Tailwind CSS v4.

---

## Getting Started

### 1. Install Dependencies
Run this command from inside the `apps/frontend` directory:
```bash
npm install
```

### 2. Start the Development Server
Launch the Vite local development server:
```bash
npm run dev
```

### 3. Open in Browser
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

Since you are not authenticated initially, the application will automatically route you to the **Login Page**.

---

---

## Build and Code Quality

Validate TypeScript and compile the production build:
```bash
# Typecheck files
npm run typecheck

# Build bundle
npm run build
```
The compiled SPA bundle will be outputted under the `dist/` directory.

