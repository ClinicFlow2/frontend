# ClinicFlow - Actionable Build Plan

> **Goal:** Deploy MVP within 2 weeks
> **Start Date:** _________
> **Target Deployment:** _________

---

## Quick Reference

### Tech Stack Summary
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| State | React Query + Context |
| Backend | Django 6 + DRF |
| Database | PostgreSQL 16 |
| Auth | JWT (SimpleJWT) |
| Deployment | Render (backend + frontend + DB) |

---

## Phase 1: MVP Implementation

### Week 1: Foundation & Core Features

---

### Day 1-2: Backend Enhancements

#### Task 1.1: Custom User Model
```bash
# In accounts/models.py
```

**Checklist:**
- [ ] Create custom User model extending AbstractBaseUser
- [ ] Add fields: license_number, specialization, clinic_name, clinic_address, phone
- [ ] Create custom UserManager
- [ ] Update settings: `AUTH_USER_MODEL = 'accounts.User'`
- [ ] Create and run migrations
- [ ] Update admin.py for User model
- [ ] Test user creation in Django shell

**Files to modify:**
- `accounts/models.py`
- `accounts/admin.py`
- `config/settings.py` (or base.py)

---

#### Task 1.2: PostgreSQL Migration
```bash
pip install psycopg2-binary
```

**Checklist:**
- [ ] Install PostgreSQL locally (if not installed)
- [ ] Create local database: `createdb clinicflow_dev`
- [ ] Update settings with DATABASE_URL support
- [ ] Install dj-database-url package
- [ ] Configure database settings
- [ ] Run fresh migrations
- [ ] Create superuser
- [ ] Verify data access

**Settings update:**
```python
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default='postgres://localhost/clinicflow_dev',
        conn_max_age=600
    )
}
```

---

#### Task 1.3: CORS Configuration
```bash
pip install django-cors-headers
```

**Checklist:**
- [ ] Install django-cors-headers
- [ ] Add to INSTALLED_APPS
- [ ] Add middleware (before CommonMiddleware)
- [ ] Configure CORS_ALLOWED_ORIGINS
- [ ] Test from frontend origin

**Settings:**
```python
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite dev server
]
```

---

#### Task 1.4: API Pagination & Filtering
```bash
pip install django-filter
```

**Checklist:**
- [ ] Install django-filter
- [ ] Create core/pagination.py with StandardPagination
- [ ] Add pagination to REST_FRAMEWORK settings
- [ ] Create patients/filters.py
- [ ] Add search filter to PatientViewSet
- [ ] Test pagination in API browser
- [ ] Test search functionality

**Pagination class:**
```python
# core/pagination.py
from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

**Patient filter:**
```python
# patients/filters.py
import django_filters
from .models import Patient

class PatientFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='search_filter')

    class Meta:
        model = Patient
        fields = ['is_active']

    def search_filter(self, queryset, name, value):
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(phone__icontains=value)
        )
```

---

#### Task 1.5: Update Requirements
**Checklist:**
- [ ] Create requirements/base.txt
- [ ] Create requirements/development.txt
- [ ] Create requirements/production.txt
- [ ] Add all new packages

**requirements/base.txt:**
```
Django>=6.0,<7.0
djangorestframework>=3.16,<4.0
djangorestframework-simplejwt>=5.5,<6.0
django-cors-headers>=4.0,<5.0
django-filter>=24.0,<25.0
dj-database-url>=2.0,<3.0
psycopg2-binary>=2.9,<3.0
python-dotenv>=1.0,<2.0
gunicorn>=23.0,<24.0
whitenoise>=6.0,<7.0
```

---

### Day 3-4: Frontend Foundation

#### Task 2.1: Project Initialization
```bash
cd clinicflow
npm create vite@latest clinicflow-frontend -- --template react-ts
cd clinicflow-frontend
npm install
```

**Checklist:**
- [ ] Create Vite React TypeScript project
- [ ] Verify project runs: `npm run dev`
- [ ] Clean up default files (App.tsx, App.css, etc.)

---

#### Task 2.2: Install Dependencies
```bash
# Core dependencies
npm install axios @tanstack/react-query react-router-dom

# UI dependencies
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Forms and validation
npm install react-hook-form @hookform/resolvers zod

# Utilities
npm install date-fns

# i18n
npm install react-i18next i18next

# Dev dependencies
npm install -D @types/node
```

**Checklist:**
- [ ] Install all packages
- [ ] Verify no version conflicts
- [ ] Update package.json scripts if needed

---

#### Task 2.3: Configure Tailwind CSS
```bash
npx tailwindcss init -p
```

**Checklist:**
- [ ] Initialize Tailwind
- [ ] Update tailwind.config.js with content paths
- [ ] Add Tailwind directives to index.css
- [ ] Verify Tailwind classes work

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... add more as needed
      },
    },
  },
  plugins: [],
}
```

---

#### Task 2.4: Setup shadcn/ui
```bash
npx shadcn@latest init
```

**Checklist:**
- [ ] Run shadcn init (choose: TypeScript, Default style, CSS variables)
- [ ] Install core components:
  ```bash
  npx shadcn@latest add button input label card
  npx shadcn@latest add table dialog alert-dialog
  npx shadcn@latest add select textarea checkbox
  npx shadcn@latest add toast tabs badge
  npx shadcn@latest add dropdown-menu avatar
  npx shadcn@latest add command popover calendar
  npx shadcn@latest add form
  ```
- [ ] Verify components are in src/components/ui/

---

#### Task 2.5: Project Structure Setup

**Checklist:**
- [ ] Create folder structure as per spec
- [ ] Create empty index.ts barrel files
- [ ] Configure path aliases in tsconfig.json and vite.config.ts

**Create folders:**
```bash
mkdir -p src/{api,components/{layout,patients,visits,prescriptions},hooks,pages/{auth,dashboard,patients,visits,prescriptions},lib,i18n,types,context}
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**tsconfig.json (add to compilerOptions):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

#### Task 2.6: API Client Setup

**Checklist:**
- [ ] Create src/api/client.ts with Axios instance
- [ ] Add request interceptor for JWT
- [ ] Add response interceptor for token refresh
- [ ] Create .env file with VITE_API_URL

**src/api/client.ts:**
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

#### Task 2.7: Authentication Context

**Checklist:**
- [ ] Create src/context/AuthContext.tsx
- [ ] Implement login, logout, isAuthenticated
- [ ] Create useAuth hook
- [ ] Test context works

**src/context/AuthContext.tsx:**
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '@/api/client';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me/');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login/', { email, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

#### Task 2.8: Layout Components

**Checklist:**
- [ ] Create Navbar.tsx
- [ ] Create Sidebar.tsx
- [ ] Create MainLayout.tsx
- [ ] Create ProtectedRoute.tsx

---

#### Task 2.9: Routing Setup

**Checklist:**
- [ ] Configure React Router in App.tsx
- [ ] Create route definitions
- [ ] Set up protected routes
- [ ] Create placeholder pages

---

### Day 5-7: Core Frontend Pages

#### Task 3.1: Login Page

**Checklist:**
- [ ] Create LoginPage.tsx
- [ ] Form with email/password
- [ ] Form validation with Zod
- [ ] Error handling and display
- [ ] Redirect after successful login

---

#### Task 3.2: Dashboard Page

**Checklist:**
- [ ] Create DashboardPage.tsx
- [ ] Stats cards (total patients, today's visits)
- [ ] Recent patients list
- [ ] Quick action buttons
- [ ] Welcome message with user name

---

#### Task 3.3: Patient List Page

**Checklist:**
- [ ] Create PatientsPage.tsx
- [ ] Table with patient data
- [ ] Search input
- [ ] Pagination controls
- [ ] "Add Patient" button
- [ ] Click row to navigate to detail

---

#### Task 3.4: Patient Form (Add/Edit)

**Checklist:**
- [ ] Create PatientForm.tsx component
- [ ] All required fields
- [ ] Date of birth picker
- [ ] Sex dropdown
- [ ] Form validation
- [ ] Create patient dialog/modal
- [ ] Edit patient functionality

---

#### Task 3.5: Patient Detail Page

**Checklist:**
- [ ] Create PatientDetailPage.tsx
- [ ] Patient info header
- [ ] Edit patient button
- [ ] Tabs: Visits, Prescriptions, Info
- [ ] Visit history list
- [ ] "New Visit" button

---

#### Task 3.6: New Visit Page

**Checklist:**
- [ ] Create NewVisitPage.tsx
- [ ] Patient info header (read-only)
- [ ] Visit type dropdown
- [ ] Chief complaint input
- [ ] Clinical fields (SOAP format)
- [ ] Vital signs form section
- [ ] Save and continue to prescription

---

#### Task 3.7: Vital Signs Component

**Checklist:**
- [ ] Create VitalSignsForm.tsx
- [ ] All vital sign fields
- [ ] Optional fields clearly marked
- [ ] Input validation (value ranges)
- [ ] Display component for viewing

---

### Week 2: Features, Polish & Deployment

---

### Day 8-9: Prescriptions & Polish

#### Task 4.1: Prescription Builder

**Checklist:**
- [ ] Create PrescriptionBuilder.tsx
- [ ] Medication search/select (Command component)
- [ ] Add medication items
- [ ] Remove medication items
- [ ] Dosage, route, frequency, duration inputs
- [ ] Instructions textarea
- [ ] Allow outside purchase checkbox
- [ ] Save prescription

---

#### Task 4.2: Prescription Display

**Checklist:**
- [ ] Create PrescriptionView.tsx
- [ ] Display prescription items
- [ ] Medication details
- [ ] Show in visit detail page

---

#### Task 4.3: API Service Files

**Checklist:**
- [ ] Create src/api/auth.ts
- [ ] Create src/api/patients.ts
- [ ] Create src/api/visits.ts
- [ ] Create src/api/prescriptions.ts
- [ ] Create React Query hooks

---

#### Task 4.4: TypeScript Types

**Checklist:**
- [ ] Create src/types/auth.ts
- [ ] Create src/types/patient.ts
- [ ] Create src/types/visit.ts
- [ ] Create src/types/prescription.ts

---

#### Task 4.5: UI Polish

**Checklist:**
- [ ] Add loading spinners/skeletons
- [ ] Add toast notifications
- [ ] Consistent error handling
- [ ] Empty states
- [ ] Confirm dialogs for destructive actions

---

#### Task 4.6: Internationalization

**Checklist:**
- [ ] Set up i18next configuration
- [ ] Create src/i18n/en.json
- [ ] Create src/i18n/fr.json
- [ ] Add language switcher
- [ ] Translate core UI strings

---

### Day 10-11: Testing & Bug Fixes

#### Task 5.1: Backend Tests

**Checklist:**
- [ ] Test user registration/login
- [ ] Test patient CRUD
- [ ] Test visit CRUD
- [ ] Test prescription creation
- [ ] Test permission isolation

---

#### Task 5.2: Frontend Tests

**Checklist:**
- [ ] Test login flow
- [ ] Test patient form validation
- [ ] Test navigation
- [ ] Test API error handling

---

#### Task 5.3: Manual Testing

**Checklist:**
- [ ] Complete user journey test
- [ ] Mobile responsive testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Fix identified bugs

---

### Day 12-14: Deployment

#### Task 6.1: Backend Deployment Prep

**Checklist:**
- [ ] Create config/settings/production.py
- [ ] Configure WhiteNoise for static files
- [ ] Create Procfile
- [ ] Create render.yaml
- [ ] Test production settings locally

**Procfile:**
```
web: gunicorn config.wsgi:application
release: python manage.py migrate
```

---

#### Task 6.2: Deploy Backend to Render

**Checklist:**
- [ ] Create Render account (if needed)
- [ ] Create PostgreSQL database
- [ ] Create web service from GitHub
- [ ] Configure environment variables
- [ ] Deploy and verify
- [ ] Create production superuser
- [ ] Test API endpoints

---

#### Task 6.3: Frontend Deployment Prep

**Checklist:**
- [ ] Create production .env
- [ ] Update API URL for production
- [ ] Build locally and test: `npm run build`
- [ ] Preview build: `npm run preview`

---

#### Task 6.4: Deploy Frontend to Render

**Checklist:**
- [ ] Create static site on Render
- [ ] Configure build command: `npm run build`
- [ ] Configure publish directory: `dist`
- [ ] Add environment variables
- [ ] Deploy and verify
- [ ] Test full application flow

---

#### Task 6.5: Post-Deployment

**Checklist:**
- [ ] Set up Sentry for error monitoring
- [ ] Configure uptime monitoring
- [ ] Test production application thoroughly
- [ ] Create initial production data (medications list)
- [ ] Document any issues found

---

## Phase 2 Backlog (Post-MVP)

### Appointments Module
- [ ] Create Appointment model
- [ ] CRUD API endpoints
- [ ] Calendar UI component
- [ ] Time slot management
- [ ] Appointment status workflow

### Prescription PDF
- [ ] Install WeasyPrint
- [ ] Create prescription template
- [ ] PDF generation endpoint
- [ ] Download button in UI

### Prescription Templates
- [ ] Template CRUD endpoints
- [ ] Template management UI
- [ ] Create from template feature

### Document Management
- [ ] AWS S3 setup
- [ ] File upload API
- [ ] Document list per patient
- [ ] File preview/download

### Advanced Features
- [ ] Celery setup for background tasks
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Analytics dashboard
- [ ] Data export (CSV/Excel)

---

## Quick Commands Reference

### Backend
```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Run tests
python manage.py test

# Make migrations
python manage.py makemigrations
```

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Add shadcn component
npx shadcn@latest add <component>
```

### Deployment
```bash
# Render CLI (optional)
render deploy

# Check logs
render logs <service-name>
```

---

## Environment Variables Checklist

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgres://user:pass@localhost/clinicflow_dev
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=ClinicFlow
```

### Production Backend (Render)
```
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=<generated>
DATABASE_URL=<from-render-postgres>
ALLOWED_HOSTS=clinicflow-api.onrender.com
CORS_ALLOWED_ORIGINS=https://clinicflow.onrender.com
DEBUG=False
```

### Production Frontend (Render)
```
VITE_API_URL=https://clinicflow-api.onrender.com/api
```

---

## Success Criteria

### MVP Complete When:
- [ ] Doctor can log in securely
- [ ] Doctor can create, view, edit patients
- [ ] Doctor can create visits with clinical notes
- [ ] Doctor can record vital signs
- [ ] Doctor can create prescriptions with medications
- [ ] Application is deployed and accessible via HTTPS
- [ ] Application works on mobile devices
- [ ] Data persists across sessions
- [ ] Basic English/French support

---

*Track progress by checking off items as you complete them.*
