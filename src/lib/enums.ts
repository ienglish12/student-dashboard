// SQLite has no native enums; these constants are the source of truth.

export const ROLES = ["ADMIN", "BRANCH"] as const;
export type Role = (typeof ROLES)[number];

export const COURSE_TYPES = ["GENERAL_ENGLISH", "TEST_PREP", "OTHER"] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

export function isCourseType(v: unknown): v is CourseType {
  return (
    typeof v === "string" && (COURSE_TYPES as readonly string[]).includes(v)
  );
}

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  GENERAL_ENGLISH: "إنجليزي عام",
  TEST_PREP: "تحضير اختبارات",
  OTHER: "أخرى",
};
