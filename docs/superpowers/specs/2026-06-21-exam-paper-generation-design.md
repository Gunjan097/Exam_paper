# Exam Paper Generation Platform — Design Spec
**Date:** 2026-06-21
**Status:** Approved

---

## 1. Product Overview

A web platform that allows teachers and school admins to generate formatted exam papers with answer keys for RBSE and CBSE boards (Class 1–12), in both English and Hindi medium. The platform combines a curated question bank with teacher-contributed questions, auto-generation logic, and a manual editing interface. A mobile app will follow after the web platform is stable.

**Key differentiators over shalasetu.com:**
- Smarter auto-generation (blueprint-driven, difficulty-balanced)
- Better UX — fast, modern, Hindi-first design
- Rich answer keys with explanations (not just bare answers)
- Teacher bulk question import via Excel/CSV
- Free-to-start, subscription for advanced features

---

## 2. Target Users

| Role | Description |
|---|---|
| Teacher | Creates papers, manages private question bank, downloads PDFs |
| School Admin | Manages teachers in their school, views all papers, approves questions |
| Superadmin | Manages the entire platform — schools, users, question approvals, plans |

All users require login. No anonymous paper generation.

---

## 3. Scope

**Boards:** RBSE, CBSE
**Classes:** 1–12
**Medium:** English, Hindi
**Output:** PDF exam paper + optional answer key (default: on)
**Phase 1:** Web platform
**Phase 2:** Mobile app (API designed mobile-ready from day one)

---

## 4. Architecture (HLD)

```
┌─────────────────────────────────────────────────────┐
│                    Clients                          │
│         Web (Next.js)    Mobile App (Phase 2)       │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS / REST (versioned: /api/v1/)
┌──────────────────▼──────────────────────────────────┐
│              API Gateway (Node.js/Express)          │
│  Auth · Questions · Papers · Schools · Subscriptions│
└────┬─────────────────────┬───────────────┬──────────┘
     │                     │               │
┌────▼──────┐    ┌──────────▼──────┐  ┌────▼──────────┐
│ PostgreSQL │    │   PDF Worker    │  │   AI Layer    │
│ (Neon)    │    │ (@react-pdf)    │  │ (Phase 2)     │
│           │    │  BullMQ queue   │  └───────────────┘
└───────────┘    └─────────────────┘
      │                  │
 ┌────▼────┐     ┌───────▼──────┐
 │ Prisma  │     │ Cloudflare R2│
 │  ORM    │     │ (PDF storage)│
 └─────────┘     └──────────────┘
         │
    ┌────▼────┐
    │ Upstash │
    │  Redis  │
    │ (queue) │
    └─────────┘
```

**Key architectural decisions:**
- API versioned at `/api/v1/` — mobile app can use same endpoints or `/v2/` later without breaking web
- PDF generation is async — teacher sees a "generating" state, downloads when ready
- UTF-8 / Devanagari support throughout — all text fields, PDFs, and imports
- No headless browser for PDF — `@react-pdf/renderer` runs in pure JS (low RAM, Render-friendly)

---

## 5. Data Models

### User
```
id, email, password_hash, name, role (teacher | school_admin | superadmin),
school_id (FK, null for superadmin), is_active, created_at
```

### School
```
id, name, address, city, state, pincode,
subscription_id (FK), is_active, created_at
```

### Question
```
id
board               RBSE | CBSE
class               1–12
subject
chapter_no
chapter_name
topic
language            English | Hindi
medium              English | Hindi
type                MCQ | Short Answer | Long Answer |
                    Fill in the Blank | True/False | Match the Column
question_text       supports Devanagari + LaTeX (math/science)
option_a/b/c/d      MCQ only
correct_answer
explanation         shown in answer key — key differentiator
marks               1–5
difficulty          Easy | Medium | Hard
source              platform | teacher
teacher_id          FK (null if source = platform)
is_approved         boolean
is_active           soft delete
created_at
```

### Blueprint
```
id, board, class, subject, name,
sections (JSON — section name, question type, marks per question, count),
total_marks, time_minutes, is_official, created_at
```

### Paper
```
id
teacher_id          FK → User
school_id           FK → School (auto from teacher)
blueprint_id        FK → Blueprint (optional)
board               RBSE | CBSE
class               1–12
subject
medium              English | Hindi
exam_type           Unit Test | Mid-Term | Final | Pre-Board | Custom
exam_title          free text (prints on paper)
academic_year       e.g. 2025-26
exam_date           date
time_allowed        e.g. 180 (minutes)
max_marks
instructions        text block at top of paper
include_answer_key  boolean (default true)
status              draft | generating | generated | failed
pdf_url             Cloudflare R2 URL
answer_key_url      Cloudflare R2 URL
created_at
```

### PaperQuestion (join table)
```
id, paper_id (FK), question_id (FK),
section_name, order_no, marks_override
```

### Subscription
```
id, school_id (FK, null for individual),
user_id (FK, null for school plan),
plan (free | teacher_pro | school_basic | school_pro),
starts_at, ends_at, is_active,
razorpay_subscription_id
```

---

## 6. API Routes

```
/api/v1/auth
  POST /register
  POST /login
  POST /refresh
  POST /forgot-password
  POST /reset-password

/api/v1/users
  GET  /me
  PUT  /me
  PUT  /me/password

/api/v1/schools
  POST /              create school (admin)
  GET  /:id
  PUT  /:id
  POST /:id/invite    invite teacher by email

/api/v1/questions
  GET  /              filter by board, class, subject, chapter, type, difficulty
  POST /              add question (teacher)
  PUT  /:id
  DELETE /:id         soft delete
  POST /import        bulk import via Excel/CSV

/api/v1/papers
  POST /              create draft
  GET  /              list teacher's papers
  GET  /:id
  PUT  /:id           update draft (swap/add/remove questions)
  POST /:id/generate  trigger PDF generation (async)
  GET  /:id/status    poll generation status
  GET  /:id/download  get signed PDF URL

/api/v1/blueprints
  GET  /              filter by board, class, subject

/api/v1/subscriptions
  GET  /plans         list available plans
  POST /subscribe     initiate Razorpay payment
  GET  /status        current subscription status

/api/v1/admin             (School Admin only)
  GET  /teachers
  POST /teachers/invite
  DELETE /teachers/:id
  GET  /papers            all papers in school
  GET  /questions/pending  questions awaiting approval
  PUT  /questions/:id/approve

/api/v1/superadmin        (Superadmin only)
  GET  /schools
  PUT  /schools/:id
  DELETE /schools/:id
  GET  /users
  DELETE /users/:id
  GET  /questions/pending
  PUT  /questions/:id/approve
  PUT  /questions/:id/reject
  GET  /plans
  POST /plans
  PUT  /plans/:id
  GET  /analytics         platform-wide usage + revenue
```

---

## 7. Core User Flows

### Flow 1: Teacher Generates a Paper
1. Login → Dashboard
2. Click "New Paper"
3. Select: Board → Class → Subject → Medium → Exam Type
4. Fill: Exam Title, Academic Year, Date, Time Allowed, Max Marks
5. (Optional) Pick a Blueprint — sections and marks auto-fill
6. Click "Auto-Generate" — system picks questions matching blueprint + difficulty
7. Review draft — swap / remove / add questions per section
8. Toggle: Include Answer Key (default on)
9. Click "Generate PDF" → async job queued
10. Download Paper PDF + Answer Key PDF

### Flow 2: Teacher Adds a Custom Question
1. My Questions → "Add Question"
2. Select: Board → Class → Subject → Chapter → Topic
3. Fill: Type, Question Text, Options (MCQ), Correct Answer, Explanation
4. Set: Marks, Difficulty, Language/Medium
5. Save → added to private bank immediately
6. (Optional) "Submit for Public Review" → goes to admin queue

### Flow 3: Teacher Bulk Imports Questions
1. Download Excel template from platform
2. Fill template in Excel / Google Sheets
3. Upload file
4. System validates → preview with errors highlighted per row
5. Fix errors or skip invalid rows → confirm import
6. Questions saved to private bank

### Flow 4: School Admin Onboards
1. Register → create school profile
2. Invite teachers via email or shareable code
3. Teachers accept invite → linked to school
4. Admin views dashboard: all papers, question submissions, usage stats
5. Approve/reject teacher-submitted questions

### Flow 5: Superadmin Manages Platform
1. Login to `/superadmin` dashboard
2. View all schools, activate/suspend
3. Approve questions for public bank from all schools
4. Create/edit subscription plans
5. View platform analytics: DAU, papers generated, revenue

---

## 8. Paper PDF Structure

```
┌──────────────────────────────────────────────┐
│              [School Name]                   │
│       [Exam Title] — [Academic Year]         │
│  Class: X    Subject: Science  Medium: Hindi │
│  Date: 15 Nov 2025    Time: 3 hrs  Marks: 80 │
│  Board: RBSE                                 │
├──────────────────────────────────────────────┤
│ General Instructions:                        │
│ [instructions text]                          │
├──────────────────────────────────────────────┤
│ Section A — MCQ (1 mark each)                │
│  Q1. ...                                     │
│  Q2. ...                                     │
├──────────────────────────────────────────────┤
│ Section B — Short Answer (2 marks each)      │
│  Q5. ...                                     │
├──────────────────────────────────────────────┤
│ Section C — Long Answer (5 marks each)       │
│  Q10. ...                                    │
└──────────────────────────────────────────────┘
```

Answer Key PDF mirrors structure with correct answers + explanations per question.

---

## 9. Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | Next.js 14 | Free |
| Frontend Deploy | Vercel | Free tier |
| Backend API | Node.js + Express | Free |
| Backend Deploy | Render.com | Free / $7/mo |
| Database | PostgreSQL via Neon | Free (3GB) |
| ORM | Prisma | Free |
| PDF Generation | @react-pdf/renderer | Free |
| Job Queue | BullMQ + Upstash Redis | Free tier |
| Auth | JWT + bcrypt | Free |
| File Storage | Cloudflare R2 | Free (10GB/mo) |
| Question Import | xlsx + papaparse | Free |
| Payments | Razorpay | ~2% per txn |

**Estimated cost at launch: $0–10/month**

---

## 10. Monetization

| Plan | Target | Features |
|---|---|---|
| Free | Individual teacher | 5 papers/month, platform question bank only |
| Teacher Pro | Individual teacher | Unlimited papers, custom questions, import, answer key |
| School Basic | School (≤20 teachers) | All Teacher Pro features for all teachers, admin dashboard |
| School Pro | School (unlimited teachers) | Everything + priority support, analytics, custom blueprints |

Payments via Razorpay (UPI, Net Banking, Cards).

---

## 11. What's Out of Scope (Phase 1)

- Online test-taking by students
- AI question suggestions (Phase 2)
- Mobile app (Phase 2)
- Other boards (UP Board, MP Board, etc.) — Phase 2
- Automated question scraping / OCR import

---

## 12. Open Questions (Resolved)

- ✅ Target boards: RBSE + CBSE
- ✅ Medium: English + Hindi
- ✅ Classes: 1–12
- ✅ Users: Teacher + School Admin + Superadmin (login required)
- ✅ Output: PDF + Answer Key (optional, default on)
- ✅ Question bank: Platform-curated + Teacher private
- ✅ Monetization: Freemium + School subscription
- ✅ API: Mobile-ready from day one (versioned REST)
