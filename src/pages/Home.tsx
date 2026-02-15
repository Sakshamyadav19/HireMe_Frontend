import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Briefcase, ArrowUp } from "lucide-react";
import { jobsApi, savedJobsApi, type JobResponse, type JobListCursorResponse } from "@/lib/api";
import { LRUCache } from "@/utils/lruCache";
import { JobCard } from "@/components/JobCard";
import { JobDetailPanel } from "@/components/JobDetailPanel";

const WINDOW_MAX_ITEMS = 500;
const PAGE_CACHE_MAX_PAGES = 20;
const PAGE_SIZE = 50;
const ESTIMATED_ROW_HEIGHT = 240;
const SCROLL_LOAD_THRESHOLD = 600;

function buildPrevCursor(job: JobResponse): string {
  return `${job.created_at},${job.id}`;
}

export default function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<JobResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [hasReachedStart, setHasReachedStart] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobResponse | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: savedData } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => savedJobsApi.list(),
  });
  const savedIds = new Set(savedData?.jobs?.map((j) => j.id) ?? []);

  const addSaved = useMutation({
    mutationFn: (jobId: string) => savedJobsApi.add(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
  });
  const removeSaved = useMutation({
    mutationFn: (jobId: string) => savedJobsApi.remove(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
  });

  const toggleSave = useCallback(
    (jobId: string) => {
      if (savedIds.has(jobId)) removeSaved.mutate(jobId);
      else addSaved.mutate(jobId);
    },
    [savedIds, addSaved, removeSaved]
  );

  const pageCacheRef = useRef(new LRUCache<string, JobListCursorResponse>(PAGE_CACHE_MAX_PAGES));
  const listRef = useRef<HTMLDivElement>(null);

  const panelOpen = selectedJob != null;
  const COLS = panelOpen ? 2 : 3;
  const rowCount = Math.ceil(items.length / COLS);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  // ── Data loading ──

  const loadNext = useCallback(async () => {
    if (loadingNext || hasReachedEnd || !nextCursor) return;
    setLoadingNext(true);
    try {
      const res = await jobsApi.listJobsCursor({ cursor: nextCursor, dir: "next", limit: PAGE_SIZE });
      pageCacheRef.current.set(nextCursor, res);
      setItems((prev) => {
        const next = [...prev, ...res.jobs];
        if (next.length > WINDOW_MAX_ITEMS) {
          return next.slice(next.length - WINDOW_MAX_ITEMS);
        }
        return next;
      });
      setNextCursor(res.next_cursor);
      if (!res.next_cursor) setHasReachedEnd(true);
    } catch {
      // keep cursor so user can retry
    } finally {
      setLoadingNext(false);
    }
  }, [nextCursor, loadingNext, hasReachedEnd]);

  const loadPrev = useCallback(async () => {
    if (loadingPrev || hasReachedStart || items.length === 0) return;
    const cursor = buildPrevCursor(items[0]);
    const cached = pageCacheRef.current.get(cursor);
    if (cached) {
      if (cached.jobs.length === 0) {
        setHasReachedStart(true);
        return;
      }
      setItems((prev) => {
        const next = [...cached.jobs, ...prev];
        if (next.length > WINDOW_MAX_ITEMS) {
          return next.slice(0, WINDOW_MAX_ITEMS);
        }
        return next;
      });
      const rowsPrepended = Math.ceil(cached.jobs.length / COLS);
      requestAnimationFrame(() => {
        window.scrollBy(0, rowsPrepended * ESTIMATED_ROW_HEIGHT);
      });
      return;
    }
    setLoadingPrev(true);
    try {
      const res = await jobsApi.listJobsCursor({ cursor, dir: "prev", limit: PAGE_SIZE });
      pageCacheRef.current.set(cursor, res);
      if (res.jobs.length === 0) {
        setHasReachedStart(true);
        return;
      }
      const prepended = res.jobs.length;
      setItems((prev) => {
        const next = [...res.jobs, ...prev];
        if (next.length > WINDOW_MAX_ITEMS) {
          return next.slice(0, WINDOW_MAX_ITEMS);
        }
        return next;
      });
      const rowsPrepended = Math.ceil(prepended / COLS);
      requestAnimationFrame(() => {
        window.scrollBy(0, rowsPrepended * ESTIMATED_ROW_HEIGHT);
      });
    } catch {
      // ignore
    } finally {
      setLoadingPrev(false);
    }
  }, [items, loadingPrev, hasReachedStart, COLS]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    jobsApi
      .listJobsCursor({ limit: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setItems(res.jobs);
          setNextCursor(res.next_cursor);
          setHasReachedEnd(!res.next_cursor);
          if (res.jobs.length > 0) {
            pageCacheRef.current.set("initial", res);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load jobs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Window scroll: infinite scroll + scroll-to-top visibility ──

  const handleWindowScroll = useCallback(() => {
    if (items.length === 0) return;
    const { scrollY, innerHeight } = window;
    const docHeight = document.documentElement.scrollHeight;
    setShowScrollTop(scrollY > 300);
    if (scrollY + innerHeight >= docHeight - SCROLL_LOAD_THRESHOLD) {
      loadNext();
    } else if (scrollY < SCROLL_LOAD_THRESHOLD) {
      loadPrev();
    }
  }, [items.length, loadNext, loadPrev]);

  useEffect(() => {
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [handleWindowScroll]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <main className="max-w-[90rem] mx-auto px-6 py-10 w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">Welcome, {user?.name}!</h1>
      <p className="text-muted-foreground mb-8">
        Browse all jobs. Use AI Job Search to upload your resume and get personalized matches.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading jobs…
        </div>
      ) : error ? (
        <Card className="rounded-2xl border-destructive/30">
          <CardContent className="py-10 text-center text-destructive">{error}</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No jobs yet. Check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent jobs</h2>
          {loadingPrev && (
            <div className="flex justify-center py-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          <div className="flex w-full gap-4">
            {/* Sticky detail panel */}
            {panelOpen && (
              <div className="sticky top-[73px] self-start h-[calc(100vh-73px)] shrink-0">
                <JobDetailPanel
                  open={panelOpen}
                  job={selectedJob}
                  onClose={() => setSelectedJob(null)}
                />
              </div>
            )}
            {/* Virtualised job grid — rendered in normal document flow */}
            <div className="flex-1 min-w-0">
              <div
                ref={listRef}
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const startIdx = virtualRow.index * COLS;
                  return (
                    <div
                      key={virtualRow.index}
                      className={`grid gap-2 absolute left-0 w-full px-1 ${COLS === 2 ? "grid-cols-2" : "grid-cols-3"}`}
                      style={{
                        top: 0,
                        transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                        paddingBottom: "0.25rem",
                      }}
                    >
                      {Array.from({ length: COLS }, (_, col) => {
                        const job = items[startIdx + col];
                        if (!job) return <div key={col} />;
                        return (
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
                              isSaved={savedIds.has(job.id)}
                              onSaveToggle={() => toggleSave(job.id)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {loadingNext && (
            <div className="flex justify-center py-4 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {hasReachedEnd && items.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">You&apos;ve reached the end of results.</p>
          )}
        </section>
      )}

      {/* Scroll to top button */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </main>
  );
}
