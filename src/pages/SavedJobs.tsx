import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Heart } from "lucide-react";
import { savedJobsApi, type JobResponse } from "@/lib/api";
import { JobCard } from "@/components/JobCard";
import { JobDetailPanel } from "@/components/JobDetailPanel";

export default function SavedJobs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<JobResponse | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => savedJobsApi.list(),
  });

  const removeSaved = useMutation({
    mutationFn: (jobId: string) => savedJobsApi.remove(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
  });

  const jobs = data?.jobs ?? [];
  const panelOpen = selectedJob != null;
  const gridCols = panelOpen ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <main className="max-w-[90rem] mx-auto px-6 py-10 w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">Welcome, {user?.name}!</h1>
      <p className="text-muted-foreground mb-8">
        Jobs you saved. Click a job to view details or unsave it.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading saved jobs…
        </div>
      ) : error ? (
        <Card className="rounded-2xl border-destructive/30">
          <CardContent className="py-10 text-center text-destructive">
            {error instanceof Error ? error.message : "Failed to load saved jobs."}
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No saved jobs. Save jobs from Home or AI Job Search.</p>
          </CardContent>
        </Card>
      ) : (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Saved jobs ({jobs.length})</h2>
          <div className="flex min-h-[70vh] w-full">
            <JobDetailPanel
              open={panelOpen}
              job={selectedJob}
              onClose={() => setSelectedJob(null)}
            />
            <div className={`flex-1 min-w-0 grid gap-4 ${gridCols}`}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                  onClick={() => setSelectedJob(job)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedJob(job);
                    }
                  }}
                >
                  <JobCard
                    job={job}
                    isSaved={true}
                    onSaveToggle={() => {
                      removeSaved.mutate(job.id);
                      if (selectedJob?.id === job.id) setSelectedJob(null);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
