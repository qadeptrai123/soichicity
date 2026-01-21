# SoichiCity 🏙️

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**SoichiCity** is a modern, high-performance social networking platform designed to provide a seamless and engaging user experience. Built with a robust **FastAPI** backend and a dynamic **React (Vite)** frontend, this project demonstrates a deep understanding of full-stack development, real-time data handling, and scalable architecture.

---

## 🚀 Tech Stack

This project leverages cutting-edge technologies to ensure performance, scalability, and developer experience.

### **Frontend**
*   **Framework:** [React 19](https://react.dev/) with [Vite](https://vitejs.dev/) for lightning-fast HMR and builds.
*   **Language:** [TypeScript](https://www.typescriptlang.org/) for type safety and maintainability.
*   **State Management:** [TanStack Query (React Query)](https://tanstack.com/query/latest) for server state & caching, [Zustand](https://github.com/pmndrs/zustand) for client state.
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) combined with [Radix UI](https://www.radix-ui.com/) for accessible, unstyled primitives.
*   **Forms:** React Hook Form + Zod for robust validation.
*   **Notifications:** Sonner for toast notifications.

### **Backend**
*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12) - High performance, easy to learn, fast to code, ready for production.
*   **Authentication:** Firebase Admin SDK for secure, server-side session management.
*   **Media Processing:** MoviePy for video handling and processing.
*   **Search:** Algolia Integration for lightning-fast search capabilities.
*   **Validation:** Pydantic for data validation and settings management.

---

## ✨ Key Features

*   **🔐 Secure Authentication**: Robust user authentication flow using Firebase Auth and JWT, ensuring data privacy and security.
*   **💬 Rich Interactions**: Create posts, threads, and comments with support for multimedia content.
*   **⚡ Optimistic UI**: Leverages React Query to provide instant feedback to users (likes, comments, etc.) while synchronizing with the server in the background.
*   **🔎 Advanced Search**: Integrated Algolia search for instant, relevant content discovery.
*   **📱 Responsive Design**: Fully responsive UI built with a mobile-first approach using Tailwind CSS.
*   **🔔 Real-time Feedback**: Interactive toast notifications and error handling for a smooth user journey.

---

## 🛠️ Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   Node.js (v18+)
*   Python 3.12+
*   Firebase Project Credentials

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python run.py
```
*Server runs at http://localhost:8000*

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*App runs at http://localhost:5173*

---

## 📂 Project Structure

```
soichicity/
├── backend/            # FastAPI Server
│   ├── app/            # Application logic (Routers, Models, Services)
│   ├── tests/          # Python tests
│   └── run.py          # Entry point
│
├── frontend/           # React Client
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks (Data fetching, logic)
│   │   ├── lib/        # API configuration (Axios, Firebase)
│   │   └── pages/      # Route pages
│   └── index.html
│
└── docs/               # Documentation & Walkthroughs
```