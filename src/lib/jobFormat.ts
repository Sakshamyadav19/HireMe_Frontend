/** Shared job formatting helpers for JobCard and JobDetailPanel */

export function getExperienceLevel(yoeMin: number): string {
  if (yoeMin <= 1) return "Entry Level";
  if (yoeMin <= 4) return "Intermediate";
  return "Expert";
}

export function getJobTypeTag(remote: string): string {
  if (remote === "remote") return "Remote";
  if (remote === "hybrid") return "Hybrid";
  return "On-site";
}

export function postedDaysAgo(createdAt: string): string {
  try {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Posted today";
    if (days === 1) return "Posted 1 day ago";
    return `Posted ${days} days ago`;
  } catch {
    return "Posted recently";
  }
}

export function formatSalary(salaryMin: number | null, salaryMax: number | null): string {
  if (salaryMin != null && salaryMax != null) {
    return `$${(salaryMin / 1000).toFixed(0)}K – $${(salaryMax / 1000).toFixed(0)}K`;
  }
  if (salaryMin != null) return `$${(salaryMin / 1000).toFixed(0)}K+`;
  if (salaryMax != null) return `Up to $${(salaryMax / 1000).toFixed(0)}K`;
  return "";
}

export const JOB_TAG_COLORS: Record<string, string> = {
  "Entry Level": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  Intermediate: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Expert: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Full-Time": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  Remote: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  Hybrid: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "On-site": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};
