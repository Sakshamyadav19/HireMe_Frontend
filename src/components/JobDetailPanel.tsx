import { useState, useEffect, useCallback } from "react";
import { X, DollarSign, Clock, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { jobsApi, type JobResponse } from "@/lib/api";
import { getExperienceLevel, getJobTypeTag, postedDaysAgo, formatSalary, JOB_TAG_COLORS } from "@/lib/jobFormat";

type JobPanelJob = Pick<
  JobResponse,
  | "id"
  | "title"
  | "company_name"
  | "years_experience_min"
  | "years_experience_max"
  | "skills_required"
  | "location"
  | "remote"
  | "salary_min"
  | "salary_max"
> & { created_at?: string; description?: string };

const PANEL_WIDTH = "22rem";

export interface JobDetailPanelProps {
  open: boolean;
  onClose: () => void;
  job: JobPanelJob | null;
  matchScore?: number;
  skillsMatched?: number;
  skillsRequired?: number;
}

export function JobDetailPanel({
  open,
  onClose,
  job,
  matchScore,
  skillsMatched,
  skillsRequired,
}: JobDetailPanelProps) {
  const [fullJob, setFullJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const needsFetch = job != null && (job.description == null || job.description === "");
  useEffect(() => {
    if (!open || !job || !needsFetch) {
      if (!open) setFullJob(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    jobsApi
      .getJob(job.id)
      .then((data) => {
        if (!cancelled) setFullJob(data);
      })
      .catch(() => {
        if (!cancelled) setFullJob(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, job?.id, needsFetch]);

  const displayJob = (fullJob ?? job) as JobPanelJob & { description?: string } | null;
  const hasDescription = displayJob?.description != null && displayJob.description !== "";

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );
  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, handleEscape]);

  if (!job) return null;

  const experienceLevel = getExperienceLevel(job.years_experience_min);
  const jobTypeTag = getJobTypeTag(job.remote);
  const experienceClass = JOB_TAG_COLORS[experienceLevel] ?? "bg-muted text-muted-foreground";
  const jobTypeClass = JOB_TAG_COLORS[jobTypeTag] ?? "bg-muted text-muted-foreground";
  const postedStr = job.created_at ? postedDaysAgo(job.created_at) : "Posted recently";

  return (
    <div
      className="flex h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out border-r border-border bg-card"
      style={{ width: open ? PANEL_WIDTH : 0 }}
    >
      <div className="flex flex-col h-full w-[22rem] shrink-0">
        <div className="flex items-start justify-between gap-2 p-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground leading-tight">{job.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{job.company_name || "Company"}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {matchScore != null && (
                <Badge variant="secondary" className="font-semibold rounded-md">
                  {Math.round(matchScore)}% match
                </Badge>
              )}
              {skillsMatched != null && skillsRequired != null && skillsRequired > 0 && (
                <span className="text-xs text-muted-foreground">
                  {skillsMatched}/{skillsRequired} skills matched
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading details…</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
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

              {formatSalary(job.salary_min, job.salary_max) && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground">
                    {formatSalary(job.salary_min, job.salary_max)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                {postedStr}
              </div>

              {job.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {job.location}
                </div>
              )}

              {job.skills_required && job.skills_required.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Required skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills_required.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hasDescription && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Description
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {displayJob!.description}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <Button className="w-full" onClick={() => {}}>
            Apply for this job
          </Button>
        </div>
      </div>
    </div>
  );
}
