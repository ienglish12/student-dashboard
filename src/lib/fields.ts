// Shared metadata for the monthly report's numeric fields.
// Used by the entry form (labels/grouping/validation hints) and aggregation.

export const NUMERIC_FIELDS = [
  "male",
  "female",
  "ageKids",
  "ageTeens",
  "ageYoungAdults",
  "ageAdults",
  "ageSeniors",
  "classGroupAdult",
  "classVipAdult",
  "classVipKid",
  "classOther",
  "levelFoundation",
  "level1",
  "level2",
  "level3",
  "level4",
  "level5",
  "level6",
  "level7",
  "level8",
  "level9",
  "onsite",
  "online",
  "home",
  "renewals",
] as const;

export type NumericField = (typeof NUMERIC_FIELDS)[number];
export type ReportNumbers = Record<NumericField, number>;

type Field = { key: NumericField; label: string };

export const GENDER_FIELDS: Field[] = [
  { key: "male", label: "ذكور" },
  { key: "female", label: "إناث" },
];

export const AGE_FIELDS: Field[] = [
  { key: "ageKids", label: "3 - 12" },
  { key: "ageTeens", label: "13 - 18" },
  { key: "ageYoungAdults", label: "19 - 30" },
  { key: "ageAdults", label: "31 - 50" },
  { key: "ageSeniors", label: "51+" },
];

export const AGE_MIDPOINTS: Record<string, number> = {
  ageKids: 8,
  ageTeens: 15.5,
  ageYoungAdults: 24.5,
  ageAdults: 40,
  ageSeniors: 58,
};

export const CLASS_FIELDS: Field[] = [
  { key: "classGroupAdult", label: "مجموعة كبار (Adult Group)" },
  { key: "classVipAdult", label: "VIP كبار (1-on-1)" },
  { key: "classVipKid", label: "أكاديمية الأطفال (Kids)" },
  { key: "classOther", label: "أخرى" },
];

export const LEVEL_FIELDS: Field[] = [
  { key: "levelFoundation", label: "Foundation" },
  { key: "level1", label: "Lvl 1" },
  { key: "level2", label: "Lvl 2" },
  { key: "level3", label: "Lvl 3" },
  { key: "level4", label: "Lvl 4" },
  { key: "level5", label: "Lvl 5" },
  { key: "level6", label: "Lvl 6" },
  { key: "level7", label: "Lvl 7" },
  { key: "level8", label: "Lvl 8" },
  { key: "level9", label: "Lvl 9" },
];

export const DELIVERY_FIELDS: Field[] = [
  { key: "onsite", label: "حضوري (Onsite)" },
  { key: "online", label: "أونلاين (Online)" },
  { key: "home", label: "منزلي (Home)" },
];

export function emptyNumbers(): ReportNumbers {
  return Object.fromEntries(
    NUMERIC_FIELDS.map((k) => [k, 0]),
  ) as ReportNumbers;
}

export function total(n: ReportNumbers): number {
  return n.male + n.female;
}

export function sumFields(n: ReportNumbers, fields: Field[]): number {
  return fields.reduce((acc, f) => acc + (n[f.key] || 0), 0);
}
