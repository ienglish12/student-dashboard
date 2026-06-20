import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const BRANCHES = [
  { name: "فرع القرهود (Al Garhoud)", slug: "al-garhoud" },
  { name: "فرع الشارقة (Sharjah)", slug: "sharjah" },
  { name: "فرع أبوظبي (Abu Dhabi)", slug: "abu-dhabi" },
  { name: "فرع العين (Al Ain)", slug: "al-ain" },
  { name: "فرع الشيخ زايد (Sheikh Zayed)", slug: "sheikh-zayed" },
  { name: "فرع القصيص (Al Qusais)", slug: "al-qusais" },
  { name: "الفرع السابع (Branch 7)", slug: "branch-7" },
];

const PERIOD = "2025-12";

// Sample monthly figures (only first 5 branches "submit" → 5/7 like the mockup)
const SAMPLE = [
  { male: 320, female: 280, nat: { السعودية: 380, مصر: 90, الإمارات: 70, الأردن: 60 } },
  { male: 150, female: 180, nat: { السعودية: 200, مصر: 60, الإمارات: 40, الأردن: 30 } },
  { male: 200, female: 160, nat: { السعودية: 220, مصر: 70, الإمارات: 50, سوريا: 20 } },
  { male: 180, female: 210, nat: { السعودية: 240, مصر: 80, الإمارات: 40, الأردن: 30 } },
  { male: 260, female: 240, nat: { السعودية: 300, مصر: 100, الإمارات: 60, الأردن: 40 } },
];

function ages(total: number) {
  return {
    ageKids: Math.round(total * 0.15),
    ageTeens: Math.round(total * 0.25),
    ageYoungAdults: Math.round(total * 0.4),
    ageAdults: Math.round(total * 0.15),
    ageSeniors: Math.round(total * 0.05),
  };
}

async function main() {
  // Branches
  const branches = [];
  for (const b of BRANCHES) {
    const branch = await prisma.branch.upsert({
      where: { slug: b.slug },
      update: { name: b.name },
      create: b,
    });
    branches.push(branch);
  }

  // Admin user
  const adminPass = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@ienglish.com" },
    update: { passwordHash: adminPass, role: "ADMIN" },
    create: {
      email: "admin@ienglish.com",
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  // One branch user per branch (email = <slug>@ienglish.com / branch123)
  const branchPass = await bcrypt.hash("branch123", 10);
  for (const branch of branches) {
    await prisma.user.upsert({
      where: { email: `${branch.slug}@ienglish.com` },
      update: { passwordHash: branchPass, role: "BRANCH", branchId: branch.id },
      create: {
        email: `${branch.slug}@ienglish.com`,
        passwordHash: branchPass,
        role: "BRANCH",
        branchId: branch.id,
      },
    });
  }

  // Default form presets (admin-editable later in Settings)
  const NAT_PRESETS = [
    "السعودية",
    "مصر",
    "الإمارات",
    "الأردن",
    "سوريا",
    "اليمن",
    "السودان",
    "فلسطين",
    "العراق",
    "أخرى",
  ];
  for (let i = 0; i < NAT_PRESETS.length; i++) {
    await prisma.nationalityPreset.upsert({
      where: { name: NAT_PRESETS[i] },
      update: { order: i },
      create: { name: NAT_PRESETS[i], order: i },
    });
  }

  const COURSE_PRESETS: { name: string; type: string }[] = [
    { name: "General English", type: "GENERAL_ENGLISH" },
    { name: "IELTS Preparation", type: "TEST_PREP" },
    { name: "TOEFL Preparation", type: "TEST_PREP" },
    { name: "Business English", type: "OTHER" },
    { name: "Kids English", type: "OTHER" },
  ];
  for (let i = 0; i < COURSE_PRESETS.length; i++) {
    await prisma.coursePreset.upsert({
      where: { name: COURSE_PRESETS[i].name },
      update: { order: i, type: COURSE_PRESETS[i].type },
      create: { ...COURSE_PRESETS[i], order: i },
    });
  }

  // Sample December reports for the first 5 branches
  for (let i = 0; i < SAMPLE.length; i++) {
    const branch = branches[i];
    const s = SAMPLE[i];
    const total = s.male + s.female;
    const a = ages(total);

    const report = await prisma.monthlyReport.upsert({
      where: { branchId_period: { branchId: branch.id, period: PERIOD } },
      update: {},
      create: {
        branchId: branch.id,
        period: PERIOD,
        male: s.male,
        female: s.female,
        ...a,
        classGroupAdult: Math.round(total * 0.7),
        classVipAdult: Math.round(total * 0.2),
        classVipKid: Math.round(total * 0.1),
        classOther: 0,
        levelFoundation: Math.round(total * 0.08),
        level1: Math.round(total * 0.12),
        level2: Math.round(total * 0.15),
        level3: Math.round(total * 0.1),
        level4: Math.round(total * 0.15),
        level5: Math.round(total * 0.1),
        level6: Math.round(total * 0.1),
        level7: Math.round(total * 0.08),
        level8: Math.round(total * 0.07),
        level9: Math.round(total * 0.05),
        onsite: Math.round(total * 0.6),
        online: Math.round(total * 0.25),
        home: Math.round(total * 0.15),
        renewals: Math.round(total * 0.78),
      },
    });

    // Replace child rows
    await prisma.nationality.deleteMany({ where: { reportId: report.id } });
    await prisma.course.deleteMany({ where: { reportId: report.id } });

    await prisma.nationality.createMany({
      data: Object.entries(s.nat).map(([name, count]) => ({
        reportId: report.id,
        name,
        count,
      })),
    });

    await prisma.course.createMany({
      data: [
        { reportId: report.id, name: "General English", type: "GENERAL_ENGLISH", count: Math.round(total * 0.65) },
        { reportId: report.id, name: "IELTS Preparation", type: "TEST_PREP", count: Math.round(total * 0.2) },
        { reportId: report.id, name: "Business English", type: "OTHER", count: Math.round(total * 0.15) },
      ],
    });
  }

  console.log("✅ Seed complete.");
  console.log("   Admin:  admin@ienglish.com / admin123");
  console.log("   Branch: al-garhoud@ienglish.com / branch123 (and other slugs)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
