-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BRANCH',
    "branchId" TEXT,
    CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "male" INTEGER NOT NULL DEFAULT 0,
    "female" INTEGER NOT NULL DEFAULT 0,
    "ageKids" INTEGER NOT NULL DEFAULT 0,
    "ageTeens" INTEGER NOT NULL DEFAULT 0,
    "ageYoungAdults" INTEGER NOT NULL DEFAULT 0,
    "ageAdults" INTEGER NOT NULL DEFAULT 0,
    "ageSeniors" INTEGER NOT NULL DEFAULT 0,
    "classGroupAdult" INTEGER NOT NULL DEFAULT 0,
    "classVipAdult" INTEGER NOT NULL DEFAULT 0,
    "classVipKid" INTEGER NOT NULL DEFAULT 0,
    "classOther" INTEGER NOT NULL DEFAULT 0,
    "levelFoundation" INTEGER NOT NULL DEFAULT 0,
    "level1" INTEGER NOT NULL DEFAULT 0,
    "level2" INTEGER NOT NULL DEFAULT 0,
    "level3" INTEGER NOT NULL DEFAULT 0,
    "level4" INTEGER NOT NULL DEFAULT 0,
    "level5" INTEGER NOT NULL DEFAULT 0,
    "level6" INTEGER NOT NULL DEFAULT 0,
    "level7" INTEGER NOT NULL DEFAULT 0,
    "level8" INTEGER NOT NULL DEFAULT 0,
    "level9" INTEGER NOT NULL DEFAULT 0,
    "onsite" INTEGER NOT NULL DEFAULT 0,
    "online" INTEGER NOT NULL DEFAULT 0,
    "home" INTEGER NOT NULL DEFAULT 0,
    "renewals" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyReport_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nationality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Nationality_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Course_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_branchId_period_key" ON "MonthlyReport"("branchId", "period");
