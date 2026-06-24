export const DEFAULT_BRANCHES = [
  { name: "القرهود", slug: "al-garhoud", legacySlugs: [] },
  { name: "الشيخ زايد", slug: "sheikh-zayed", legacySlugs: [] },
  { name: "الشارقة", slug: "sharjah", legacySlugs: [] },
  { name: "ابوظبي-المرور", slug: "abu-dhabi-al-muroor", legacySlugs: ["abu-dhabi"] },
  { name: "ابوظبي-المصدر", slug: "abu-dhabi-al-masdar", legacySlugs: ["al-qusais"] },
  { name: "العين", slug: "al-ain", legacySlugs: [] },
  { name: "الفجيرة", slug: "fujairah", legacySlugs: ["branch-7"] },
] as const;

type BranchLike = {
  id?: string;
  name: string;
  slug?: string | null;
};

const legacyNames = [
  ["فرع القرهود (Al Garhoud)", "القرهود"],
  ["فرع الشيخ زايد (Sheikh Zayed)", "الشيخ زايد"],
  ["فرع الشارقة (Sharjah)", "الشارقة"],
  ["فرع أبوظبي (Abu Dhabi)", "ابوظبي-المرور"],
  ["فرع العين (Al Ain)", "العين"],
  ["فرع القصيص (Al Qusais)", "ابوظبي-المصدر"],
  ["الفرع السابع (Branch 7)", "الفجيرة"],
] as const;

const displayNameBySlug = new Map<string, string>();
const sortRankBySlug = new Map<string, number>();
const displayNameByLegacyName = new Map<string, string>(legacyNames);
const sortRankByName = new Map<string, number>();

DEFAULT_BRANCHES.forEach((branch, index) => {
  displayNameBySlug.set(branch.slug, branch.name);
  sortRankBySlug.set(branch.slug, index);
  sortRankByName.set(branch.name, index);

  for (const slug of branch.legacySlugs) {
    displayNameBySlug.set(slug, branch.name);
    sortRankBySlug.set(slug, index);
  }
});

legacyNames.forEach(([legacyName, displayName]) => {
  const rank = sortRankByName.get(displayName);
  if (rank !== undefined) sortRankByName.set(legacyName, rank);
});

export function branchDisplayName<T extends BranchLike>(branch: T) {
  if (branch.slug && displayNameBySlug.has(branch.slug)) {
    return displayNameBySlug.get(branch.slug)!;
  }
  return displayNameByLegacyName.get(branch.name) ?? branch.name;
}

export function sortBranches<T extends BranchLike>(branches: T[]) {
  return [...branches].sort((a, b) => {
    const aRank = branchRank(a);
    const bRank = branchRank(b);
    if (aRank !== bRank) return aRank - bRank;
    return branchDisplayName(a).localeCompare(branchDisplayName(b), "ar");
  });
}

export function toBranchRef<T extends BranchLike & { id: string }>(branch: T) {
  return { id: branch.id, name: branchDisplayName(branch) };
}

function branchRank(branch: BranchLike) {
  if (branch.slug && sortRankBySlug.has(branch.slug)) {
    return sortRankBySlug.get(branch.slug)!;
  }
  return sortRankByName.get(branch.name) ?? Number.MAX_SAFE_INTEGER;
}
