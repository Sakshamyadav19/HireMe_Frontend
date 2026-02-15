import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Heart, Clock } from "lucide-react";
import { getExperienceLevel, getJobTypeTag, postedDaysAgo, formatSalary, JOB_TAG_COLORS } from "@/lib/jobFormat";

/** Job shape for the card; matches JobResponse with optional created_at/description for match results */
export type JobCardJob = Pick<
  import("@/lib/api").JobResponse,
  | "id"
  | "title"
  | "company_name"
  | "domain"
  | "subdomain"
  | "years_experience_min"
  | "years_experience_max"
  | "skills_required"
  | "location"
  | "remote"
  | "salary_min"
  | "salary_max"
> & { created_at?: string; description?: string };

export interface JobCardProps {
  job: JobCardJob;
  /** When set, show match score badge (for AI search results) */
  matchScore?: number;
  /** When set with skillsRequired, show "X/Y skills matched" above compensation (for AI search) */
  skillsMatched?: number;
  skillsRequired?: number;
  /** When set, show heart and call on save/unsave (no card open on heart click) */
  isSaved?: boolean;
  onSaveToggle?: () => void;
  className?: string;
}

export function JobCard({ job, matchScore, skillsMatched, skillsRequired, isSaved, onSaveToggle, className = "" }: JobCardProps) {
  const experienceLevel = getExperienceLevel(job.years_experience_min);
  const jobTypeTag = getJobTypeTag(job.remote);
  const salaryStr = formatSalary(job.salary_min, job.salary_max);
  const experienceClass = JOB_TAG_COLORS[experienceLevel] ?? "bg-muted text-muted-foreground";
  const jobTypeClass = JOB_TAG_COLORS[jobTypeTag] ?? "bg-muted text-muted-foreground";
  const initial = (job.company_name || "C")[0].toUpperCase();
  const [glow, setGlow] = useState(false);

  return (
    <Card className={`rounded-xl border border-border bg-card shadow-sm overflow-hidden min-h-[200px] ${className}`}>
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground">
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground leading-tight truncate">{job.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {job.company_name || "Company"}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            {matchScore != null && (
              <Badge variant="secondary" className="font-semibold rounded-md">
                {Math.round(matchScore)}% match
              </Badge>
            )}
            {onSaveToggle != null && (
              <button
                type="button"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label={isSaved ? "Unsave job" : "Save job"}
                onClick={(e) => {
                  e.stopPropagation();
                  setGlow(true);
                  onSaveToggle();
                  setTimeout(() => setGlow(false), 500);
                }}
              >
                <Heart
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isSaved ? "fill-current text-primary" : ""
                  } ${glow ? "animate-heart-pop" : ""}`}
                />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${experienceClass}`}>
            {experienceLevel}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${jobTypeClass}`}>
            {jobTypeTag}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Full-Time
          </span>
        </div>

        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 min-h-[2.5rem]">
            {job.description}
          </p>
        )}

        {skillsMatched != null && skillsRequired != null && skillsRequired > 0 && (
          <p className="text-sm text-muted-foreground mb-2">
            {skillsMatched}/{skillsRequired} skills matched
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border text-sm">
          {salaryStr ? (
            <span className="flex items-center gap-1 text-foreground font-medium">
              <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
              {salaryStr}
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-muted-foreground shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {job.created_at ? postedDaysAgo(job.created_at) : "Posted recently"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
