-- CreateEnum
CREATE TYPE "Role" AS ENUM ('teacher', 'school_admin', 'superadmin');

-- CreateEnum
CREATE TYPE "Board" AS ENUM ('RBSE', 'CBSE');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('English', 'Hindi');

-- CreateEnum
CREATE TYPE "Medium" AS ENUM ('English', 'Hindi');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'ShortAnswer', 'LongAnswer', 'FillInBlank', 'TrueFalse', 'MatchColumn');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('platform', 'teacher');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('UnitTest', 'MidTerm', 'Final', 'PreBoard', 'Custom');

-- CreateEnum
CREATE TYPE "PaperStatus" AS ENUM ('draft', 'generating', 'generated', 'failed');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'teacher_pro', 'school_basic', 'school_pro');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'teacher',
    "school_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reset_token" TEXT,
    "reset_token_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "board" "Board" NOT NULL,
    "class" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter_no" INTEGER,
    "chapter_name" TEXT NOT NULL,
    "topic" TEXT,
    "language" "Language" NOT NULL,
    "medium" "Medium" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question_text" TEXT NOT NULL,
    "option_a" TEXT,
    "option_b" TEXT,
    "option_c" TEXT,
    "option_d" TEXT,
    "correct_answer" TEXT NOT NULL,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'platform',
    "teacher_id" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprints" (
    "id" TEXT NOT NULL,
    "board" "Board" NOT NULL,
    "class" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "time_minutes" INTEGER NOT NULL,
    "is_official" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "papers" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "blueprint_id" TEXT,
    "board" "Board" NOT NULL,
    "class" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "medium" "Medium" NOT NULL,
    "exam_type" "ExamType" NOT NULL,
    "exam_title" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "exam_date" TIMESTAMP(3),
    "time_allowed" INTEGER NOT NULL,
    "max_marks" INTEGER NOT NULL,
    "instructions" TEXT,
    "include_answer_key" BOOLEAN NOT NULL DEFAULT true,
    "status" "PaperStatus" NOT NULL DEFAULT 'draft',
    "pdf_url" TEXT,
    "answer_key_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_questions" (
    "id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "section_name" TEXT NOT NULL,
    "order_no" INTEGER NOT NULL,
    "marks_override" INTEGER,

    CONSTRAINT "paper_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "user_id" TEXT,
    "plan" "Plan" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "razorpay_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_school_id_key" ON "subscriptions"("school_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "papers" ADD CONSTRAINT "papers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "papers" ADD CONSTRAINT "papers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "papers" ADD CONSTRAINT "papers_blueprint_id_fkey" FOREIGN KEY ("blueprint_id") REFERENCES "blueprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_questions" ADD CONSTRAINT "paper_questions_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "papers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_questions" ADD CONSTRAINT "paper_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
