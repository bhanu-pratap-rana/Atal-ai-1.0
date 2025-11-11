# ATAL AI - Digital Empowerment Platform

A comprehensive digital literacy platform built with Next.js, Supabase, and modern web technologies. ATAL AI provides an interactive learning experience for students and teachers to build essential digital skills.

## 🌟 Features

### For Students
- 📚 **Interactive Curriculum** - Structured digital literacy courses
- 📝 **Multi-language Assessments** - Pre and post-assessments with i18n support
- 📊 **Progress Tracking** - Monitor learning progress and achievements
- 🎯 **Personalized Learning** - AI-powered recommendations
- 👥 **Class Enrollment** - Join classes via invite codes or QR codes

### For Teachers
- 📋 **Class Management** - Create and manage multiple classes
- 👨‍🎓 **Student Roster** - Track student enrollment and progress
- 📈 **Analytics Dashboard** - Real-time insights on student performance
- 🔗 **Easy Invitations** - Share invite codes or QR codes with students
- ✅ **Assessment Creation** - Design custom assessments and quizzes

### Security & Authentication
- 🔐 **OTP Email Authentication** - Secure passwordless login
- ✉️ **Email Validation** - Comprehensive typo detection for 85+ patterns across 8 major providers
- 🛡️ **Disposable Email Blocking** - Prevents spam and fake accounts
- 🔒 **Role-Based Access Control** - Teacher and student permissions
- 🌐 **SSR-Compatible Auth** - Server-side rendering with session management

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Supabase Auth with OTP
- **Testing**: Playwright for E2E tests
- **Deployment**: Vercel-ready

### Project Structure
```
Atal-ai-1.0/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   │   ├── (public)/  # Public routes (login, join)
│   │   │   │   ├── app/       # Protected routes
│   │   │   │   └── actions/   # Server actions
│   │   │   ├── components/    # React components
│   │   │   │   ├── ui/        # shadcn/ui components
│   │   │   │   ├── auth/      # Auth components
│   │   │   │   ├── teacher/   # Teacher-specific components
│   │   │   │   └── assessment/ # Assessment components
│   │   │   ├── lib/           # Utilities
│   │   │   │   ├── supabase-server.ts  # Server-side Supabase client
│   │   │   │   ├── supabase-browser.ts # Client-side Supabase client
│   │   │   │   └── utils.ts   # Helper functions
│   │   │   └── data/          # Static data
│   │   └── public/            # Static assets
│   └── db/                    # Database related files
│       └── email-templates/   # Custom email templates
├── docs/                      # Documentation
└── packages/                  # Shared packages (if any)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn** or **pnpm**
- **Supabase account** (free tier works)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/atal-ai.git
   cd atal-ai
   ```

2. **Install dependencies**
   ```bash
   cd apps/web
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)

   b. Run the database migrations (see [Database Setup](#database-setup))

   c. Configure email templates (see [Email Templates](#email-templates))

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

### Development
```bash
npm run dev          # Start development server (localhost:3000)
```

### Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Testing
```bash
npm run test         # Run Playwright E2E tests
npm run test:ui      # Run tests with Playwright UI
npm run test:headed  # Run tests in headed mode (visible browser)
npm run test:debug   # Debug tests with Playwright inspector
npm run test:report  # Show test report
```

### Linting
```bash
npm run lint         # Run ESLint
```

## 🗄️ Database Setup

### Schema Overview

The application uses the following main tables:

- **auth.users** - User authentication (managed by Supabase Auth)
- **classes** - Teacher-created classes
- **class_invites** - Invitation codes for classes
- **students** - Student profiles and metadata
- **enrollments** - Student-class relationships
- **assessments** - Assessment/quiz definitions
- **assessment_results** - Student assessment scores

### Running Migrations

You can set up the database schema using Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration files from `apps/db/migrations/` in order
4. Set up Row Level Security (RLS) policies as needed

### Database Policies

The application uses Row Level Security (RLS) to ensure:
- Students can only view their own data
- Teachers can only manage their own classes
- Proper authentication checks on all operations

## 📧 Email Templates

Custom email templates are located in `apps/db/email-templates/`:

- `magic-link.html` - OTP email for authentication
- `confirm-signup.html` - New user signup confirmation
- `invite-user.html` - Class invitation emails
- `reset-password.html` - Password reset emails
- `change-email.html` - Email change confirmation

### Configuring Email Templates

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Copy content from each template file
3. Customize with your branding (logo, colors, etc.)
4. Save each template

### Email Features

- ✅ Responsive design (works on all devices)
- ✅ Orange/yellow/white color scheme matching brand
- ✅ Professional formatting
- ✅ Action buttons for OTP/magic links
- ✅ Footer with app information

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (safe to expose) | `eyJhbGc...` |
| `NEXT_PUBLIC_APP_URL` | Your application URL | `http://localhost:3000` or `https://yourdomain.com` |

### Security Notes

⚠️ **NEVER commit `.env` or `.env.local` files to git!**

- The `.env.example` file contains safe placeholders
- All secrets should be stored in `.env.local` (gitignored)
- For production, use environment variables in your hosting platform (Vercel, etc.)

### Rotating Secrets

If your secrets were accidentally exposed:

1. **Immediately** go to Supabase Dashboard → **Settings** → **API**
2. Click **"Regenerate"** next to the compromised key
3. Update all environments with the new keys
4. Redeploy your application

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_APP_URL` (use your Vercel domain)

3. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-project.vercel.app`

### Deploy to Other Platforms

The application can be deployed to any platform that supports Next.js:
- **Netlify** - Import from Git
- **Railway** - Deploy from GitHub
- **AWS Amplify** - Connect repository
- **DigitalOcean App Platform** - Import from Git

Make sure to:
1. Set all environment variables
2. Use Node.js 20.x or higher
3. Set build command: `npm run build`
4. Set start command: `npm run start`

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test tests/auth.spec.ts

# Run tests in headed mode (see browser)
npm run test:headed

# Debug a specific test
npm run test:debug
```

### Test Coverage

- ✅ Authentication flow (OTP login)
- ✅ Email validation with typo detection
- ✅ Class creation and management
- ✅ Student enrollment
- ✅ Assessment taking and scoring
- ✅ Dashboard navigation

### Writing Tests

Tests are located in `apps/web/tests/`. Example test:

```typescript
import { test, expect } from '@playwright/test'

test('user can login with OTP', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/.*verify/)
})
```

## 📝 Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow TypeScript best practices
   - Add tests for new features
   - Update documentation as needed

3. **Run tests and linting**
   ```bash
   npm run lint
   npm run test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- **TypeScript** for all new code
- **Functional components** with hooks
- **Server components** by default (use 'use client' only when needed)
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components

### Commit Message Format

```
Type: Short description

- Detailed point 1
- Detailed point 2

Type can be: Add, Update, Fix, Remove, Refactor, Docs, Test
```

## 🐛 Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables" error**
- Make sure `.env.local` exists in `apps/web/`
- Check that all required variables are set
- Restart the dev server after changing `.env.local`

**2. OTP emails not sending**
- Go to Supabase Dashboard → **Authentication** → **Email Templates**
- Check that templates are configured
- Verify email service is enabled
- Check Supabase logs for errors

**3. "Cannot find module" errors**
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

**4. Port 3000 already in use**
- Kill the process: `lsof -ti:3000 | xargs kill` (Mac/Linux)
- Or use a different port: `PORT=3001 npm run dev`

**5. Database connection errors**
- Check your Supabase URL is correct
- Verify your API key is valid
- Check if your Supabase project is paused (free tier limitation)

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🤝 Support

For issues and questions:
- Create an issue in GitHub
- Check existing documentation
- Review troubleshooting section

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline mode support
- [ ] Advanced analytics dashboard
- [ ] AI-powered content recommendations
- [ ] Video learning modules
- [ ] Certificate generation
- [ ] Multi-language support (Hindi, regional languages)

## 📊 Project Status

- ✅ Core authentication system
- ✅ Email validation with typo detection
- ✅ Class management for teachers
- ✅ Student enrollment system
- ✅ Assessment system with multi-language support
- ✅ Analytics dashboard
- ✅ Responsive UI design
- 🚧 Advanced reporting (in progress)
- 🚧 Mobile optimization (planned)

---

**Built with ❤️ for digital empowerment in India**

Last updated: 2025-11-11
Version: 1.0.0
