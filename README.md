# Latex AI Writer V2

## 🎯 Purpose
A web-based application designed to assist researchers and students in generating and formatting LaTeX documents using Artificial Intelligence, simplifying the complex syntax of academic writing through a modern interface.

## 🛠️ Technologies
- **Language:** TypeScript (Frontend), Python (Backend), PLpgSQL (Database)
- **Frameworks:** Next.js (React Framework), Supabase (Backend-as-a-Service)
- **Cloud:** Vercel (Frontend Hosting), Supabase (Database & Auth)

## 🚀 Key Features
- **AI-Powered Generation:** Automates the creation of complex LaTeX equations and document structures using AI models.
- **Real-Time Synchronization:** Utilizes Supabase to store and sync user documents and preferences across devices instantly.
- **Modern Web Interface:** Features a responsive, TypeScript-based frontend deployed on Vercel for a seamless user experience.

## 📂 Project Structure
~~~text
/backend            - Python-based backend logic for AI processing
/vercel-frontend    - Next.js frontend application source code
/supabase-functions - Database migrations and serverless functions
/GEMINI.md          - Project specific documentation
~~~

## 🔧 Setup & Installation
~~~bash
# Clone the repository
git clone https://github.com/MalanSathya/latex-ai-writer-v2.git

# Frontend Setup
cd vercel-frontend
npm install
npm run dev

# Backend Setup
cd backend
# (Ensure Python environment is active)
pip install -r requirements.txt
python main.py
~~~

## 📊 Results
- **Development Efficiency:** Leveraged Vercel for continuous deployment, significantly reducing iteration time during development.
- **Scalable Architecture:** Built on Supabase to handle user authentication and data storage without the overhead of managing dedicated database servers.
- **User Accessibility:** Provides a GUI wrapper around LaTeX, effectively lowering the technical barrier for new users entering academic writing.

## 🔗 Related Projects
- [Project Source Code](https://github.com/MalanSathya/latex-ai-writer-v2)
- [Live Deployment](https://latex-ai-writer-v2.vercel.app)
