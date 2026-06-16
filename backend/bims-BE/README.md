# Brandfluence Backend API

A Brand-Influencer Collaboration Platform backend built with FastAPI.

## 🚀 Features

- **User Authentication**: JWT-based authentication with role-based access control (Brand, Influencer, Admin)
- **Brand Management**: Create and manage brand profiles
- **Influencer Management**: Create and manage influencer profiles with portfolio
- **Campaign Management**: Create, manage, and track campaigns
- **Task Management**: Kanban-style task board for campaign deliverables
- **Content Submission**: Influencers can submit content for review
- **Payment System**: Foundation for milestone-based payments (ready for smart contracts)

## 📋 Prerequisites

- Python 3.8+
- pip
- Virtual environment (recommended)

## 🛠️ Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables** (optional):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the `SECRET_KEY` with a strong random key.
   Note: The database will be created automatically when you start the server.

## 🏃 Running the Application

Start the development server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

## 📁 Project Structure

```
bims-BE/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Application configuration
│   │   ├── database.py          # Database setup and session management
│   │   └── security.py         # Authentication and password hashing
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # User model
│   │   ├── brand.py            # Brand model
│   │   ├── influencer.py       # Influencer model
│   │   ├── campaign.py         # Campaign model
│   │   ├── task.py             # Task model
│   │   ├── content.py          # Content model
│   │   ├── payment.py          # Payment and Milestone models
│   │   └── message.py          # Message model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # User Pydantic schemas
│   │   ├── brand.py            # Brand Pydantic schemas
│   │   ├── influencer.py       # Influencer Pydantic schemas
│   │   ├── campaign.py         # Campaign Pydantic schemas
│   │   ├── task.py             # Task Pydantic schemas
│   │   └── content.py          # Content Pydantic schemas
│   └── api/
│       └── v1/
│           ├── __init__.py
│           ├── api.py          # Main API router
│           ├── dependencies.py # API dependencies (auth, etc.)
│           └── endpoints/
│               ├── __init__.py
│               ├── auth.py     # Authentication endpoints
│               ├── brands.py   # Brand endpoints
│               ├── influencers.py # Influencer endpoints
│               ├── campaigns.py   # Campaign endpoints
│               ├── tasks.py       # Task endpoints
│               └── content.py    # Content endpoints
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Register a new user: `POST /api/v1/auth/register`
2. Login: `POST /api/v1/auth/login` (returns access token)
3. Use the token in requests: `Authorization: Bearer <token>`

### User Roles

- **brand**: Can create campaigns, manage tasks, review content
- **influencer**: Can manage profile, accept campaigns, submit content
- **admin**: Full access (to be implemented)

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get access token
- `GET /api/v1/auth/me` - Get current user info

### Brands
- `POST /api/v1/brands` - Create brand profile
- `GET /api/v1/brands/me` - Get my brand profile
- `PUT /api/v1/brands/me` - Update my brand profile
- `GET /api/v1/brands` - List all brands
- `GET /api/v1/brands/{id}` - Get brand by ID

### Influencers
- `POST /api/v1/influencers` - Create influencer profile
- `GET /api/v1/influencers/me` - Get my influencer profile
- `PUT /api/v1/influencers/me` - Update my influencer profile
- `GET /api/v1/influencers` - List influencers (with filters)
- `GET /api/v1/influencers/{id}` - Get influencer by ID

### Campaigns
- `POST /api/v1/campaigns` - Create campaign (brand only)
- `GET /api/v1/campaigns` - List campaigns
- `GET /api/v1/campaigns/{id}` - Get campaign by ID
- `PUT /api/v1/campaigns/{id}` - Update campaign (brand only)

### Tasks
- `POST /api/v1/tasks` - Create task (brand only)
- `GET /api/v1/tasks` - List tasks
- `GET /api/v1/tasks/{id}` - Get task by ID
- `PUT /api/v1/tasks/{id}` - Update task

### Content
- `POST /api/v1/content/task/{task_id}` - Submit content (influencer only)
- `GET /api/v1/content/task/{task_id}` - Get content by task
- `GET /api/v1/content/{id}` - Get content by ID
- `PUT /api/v1/content/{id}` - Update/review content

## 🗄️ Database

Currently using SQLite for development. The database file `brandfluence.db` will be created automatically on first run.

### Migrating to PostgreSQL

To migrate to PostgreSQL, update the `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/brandfluence
```

The SQLAlchemy setup is already compatible with PostgreSQL.

## 🔮 Future Enhancements

- [ ] Smart contract integration for milestone payments
- [ ] Social media API integrations (Instagram, YouTube, TikTok)
- [ ] AI-powered influencer matching
- [ ] Real-time messaging system
- [ ] Analytics and insights dashboard
- [ ] File upload handling
- [ ] Email notifications
- [ ] Rating and review system
- [ ] Marketplace for tools and services

## 📝 License

This project is part of the Brandfluence platform.

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.
