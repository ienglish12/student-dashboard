-- CreateTable
CREATE TABLE "NationalityPreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "CoursePreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL_ENGLISH',
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "NationalityPreset_name_key" ON "NationalityPreset"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePreset_name_key" ON "CoursePreset"("name");
