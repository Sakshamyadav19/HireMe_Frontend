import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useMatchResults } from "@/contexts/MatchResultsContext";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Upload, FileText, TrendingUp, AlertCircle, Loader2, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  matchApi,
  savedJobsApi,
  ApiError,
  type MatchResult,
  type MatchResultsCursorResponse,
} from "@/lib/api";
import { LRUCache } from "@/utils/lruCache";
import { JobCard } from "@/components/JobCard";
import { JobDetailPanel } from "@/components/JobDetailPanel";

const ACCEPTED_TYPES = ".pdf,.docx,.txt";
const MAX_SIZE_MB = 10;
const WINDOW_MAX_ITEMS = 500;
const PAGE_CACHE_MAX_PAGES = 20;
const PAGE_SIZE = 50;
const ESTIMATED_ROW_HEIGHT = 240;
const SCROLL_LOAD_THRESHOLD = 600;

export default function AISearch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { totalMatches, setTotalMatches, currentJobId, setCurrentJobId } = useMatchResults();
  const [items, setItems] = useState<MatchResult[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [startOffset, setStartOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [hasReachedStart, setHasReachedStart] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  /** True when a match job is in flight (pending/processing); persists across tab switch. */
  const jobInProgress = currentJobId != null;

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

  const pageCacheRef = useRef(new LRUCache<string, MatchResultsCursorResponse>(PAGE_CACHE_MAX_PAGES));
  const listRef = useRef<HTMLDivElement>(null);

  const panelOpen = selectedMatch != null;
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
      const res = await matchApi.getResultsPage({
        cursor: nextCursor,
        limit: PAGE_SIZE,
        dir: "next",
      });
      pageCacheRef.current.set(nextCursor, res);
      setItems((prev) => {
        const next = [...prev, ...res.matches];
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
    if (loadingPrev || hasReachedStart || startOffset <= 0) return;
    const cursor = String(startOffset);
    const cached = pageCacheRef.current.get(cursor);
    if (cached) {
      if (cached.matches.length === 0) {
        setHasReachedStart(true);
        return;
      }
      setItems((prev) => {
        const next = [...cached.matches, ...prev];
        if (next.length > WINDOW_MAX_ITEMS) {
          return next.slice(0, WINDOW_MAX_ITEMS);
        }
        return next;
      });
      setStartOffset(Math.max(0, startOffset - cached.matches.length));
      if (startOffset - cached.matches.length <= 0) setHasReachedStart(true);
      const rowsPrepended = Math.ceil(cached.matches.length / COLS);
      requestAnimationFrame(() => {
        window.scrollBy(0, rowsPrepended * ESTIMATED_ROW_HEIGHT);
      });
      return;
    }
    setLoadingPrev(true);
    try {
      const res = await matchApi.getResultsPage({
        cursor,
        limit: PAGE_SIZE,
        dir: "prev",
      });
      pageCacheRef.current.set(cursor, res);
      if (res.matches.length === 0) {
        setHasReachedStart(true);
        return;
      }
      const prepended = res.matches.length;
      setItems((prev) => {
        const next = [...res.matches, ...prev];
        if (next.length > WINDOW_MAX_ITEMS) {
          return next.slice(0, WINDOW_MAX_ITEMS);
        }
        return next;
      });
      const newStart = Math.max(0, startOffset - prepended);
      setStartOffset(newStart);
      if (newStart <= 0) setHasReachedStart(true);
      const rowsPrependedCount = Math.ceil(prepended / COLS);
      requestAnimationFrame(() => {
        window.scrollBy(0, rowsPrependedCount * ESTIMATED_ROW_HEIGHT);
      });
    } catch {
      // ignore
    } finally {
      setLoadingPrev(false);
    }
  }, [startOffset, loadingPrev, hasReachedStart, COLS]);

  // Initial load: probe GET first page when mounting (skip when a job is in flight)
  useEffect(() => {
    if (currentJobId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    matchApi
      .getResultsPage({ limit: PAGE_SIZE, dir: "next" })
      .then((res) => {
        if (!cancelled) {
          setItems(res.matches);
          setNextCursor(res.next_cursor);
          setStartOffset(0);
          setHasReachedEnd(!res.next_cursor);
          setHasReachedStart(true);
          setTotalMatches(res.total_matches);
          if (res.matches.length > 0) {
            pageCacheRef.current.set("initial", res);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load results.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setInitialLoadDone(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [setTotalMatches, currentJobId]);

  const POLL_INTERVAL_MS = 1500;

  // Poll for job status when currentJobId is set (persists across tab switch)
  useEffect(() => {
    const jobId = currentJobId;
    if (!jobId) return;
    let cancelled = false;
    setError(null);

    const poll = async () => {
      while (!cancelled) {
        try {
          const statusRes = await matchApi.getMatchJobStatus(jobId);
          if (cancelled) return;
          if (statusRes.status === "completed") {
            const page = await matchApi.getResultsPage({
              limit: PAGE_SIZE,
              dir: "next",
            });
            if (cancelled) return;
            setItems(page.matches);
            setNextCursor(page.next_cursor);
            setStartOffset(0);
            setHasReachedEnd(!page.next_cursor);
            setHasReachedStart(true);
            setTotalMatches(page.total_matches);
            if (page.matches.length > 0) {
              pageCacheRef.current.set("initial", page);
            }
            setCurrentJobId(null);
            return;
          }
          if (statusRes.status === "failed") {
            setError(statusRes.error ?? "Matching failed.");
            setCurrentJobId(null);
            return;
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof ApiError ? err.message : "Failed to check status.");
            setCurrentJobId(null);
          }
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [currentJobId, setCurrentJobId]);

  // ── Window scroll: infinite scroll + scroll-to-top visibility ──

  const handleWindowScroll = useCallback(() => {
    if (items.length === 0) return;
    const { scrollY, innerHeight } = window;
    const docHeight = document.documentElement.scrollHeight;
    // Show scroll-to-top button after scrolling 300px
    setShowScrollTop(scrollY > 300);
    // Infinite scroll triggers
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

  // ── Handlers ──

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    setError(null);
    if (!chosen) {
      setFile(null);
      return;
    }
    if (chosen.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB`);
      setFile(null);
      return;
    }
    const ext = chosen.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setError("Please upload a PDF, DOCX, or TXT file");
      setFile(null);
      return;
    }
    setFile(chosen);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = e.dataTransfer.files?.[0];
      if (!dropped) return;
      const fakeEvent = { target: { files: [dropped] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const uploadAndMatch = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { job_id } = await matchApi.uploadResume(file);
      setFile(null);
      setCurrentJobId(job_id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const showResults =
    initialLoadDone && (totalMatches != null || items.length > 0);
  const displayTotal = totalMatches ?? items.length;

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <main className="max-w-[90rem] mx-auto px-6 py-10 w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">Welcome, {user?.name}!</h1>
      <p className="text-muted-foreground mb-8">
        Upload your resume to get ranked job matches based on your skills and experience.
      </p>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload resume
          </CardTitle>
          <CardDescription>
            PDF, DOCX, or TXT — max {MAX_SIZE_MB} MB. We extract your profile and match you with jobs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <input
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="cursor-pointer block">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              {file ? (
                <p className="text-sm font-medium text-foreground">{file.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Drag and drop your resume here, or <span className="text-primary font-medium">browse</span>
                </p>
              )}
            </label>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <Button
            onClick={uploadAndMatch}
            disabled={!file || uploading || jobInProgress}
            className="w-full sm:w-auto"
          >
            {uploading || jobInProgress ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {jobInProgress ? "Matching in progress…" : "Matching…"}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & get matches
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {jobInProgress ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Matching in progress…</p>
          <p className="text-xs">You can switch tabs; results will appear here when ready.</p>
        </div>
      ) : loading && !initialLoadDone ? (
        <div className="flex justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      ) : showResults && displayTotal === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No jobs matched your profile right now. Try adding more skills to your resume or check back later.
          </CardContent>
        </Card>
      ) : showResults && items.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your matches ({displayTotal})
          </h2>
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
                  job={selectedMatch?.job ?? null}
                  onClose={() => setSelectedMatch(null)}
                  matchScore={selectedMatch?.score}
                  skillsMatched={
                    selectedMatch ? selectedMatch.explanation.matched_skills.length : undefined
                  }
                  skillsRequired={
                    selectedMatch
                      ? selectedMatch.explanation.matched_skills.length +
                        selectedMatch.explanation.missing_required.length
                      : undefined
                  }
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
                        const match = items[startIdx + col];
                        if (!match) return <div key={col} />;
                        const { job, score, explanation } = match;
                        const matched = explanation.matched_skills.length;
                        const required = matched + explanation.missing_required.length;
                        return (
                          <div
                            key={job.id}
                            role="button"
                            tabIndex={0}
                            className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                            onClick={() => setSelectedMatch(match)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedMatch(match);
                              }
                            }}
                          >
                            <JobCard
                              job={job}
                              matchScore={score}
                              skillsMatched={matched}
                              skillsRequired={required}
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
            <p className="text-center text-sm text-muted-foreground py-4">
              You&apos;ve reached the end of results.
            </p>
          )}
        </section>
      ) : null}

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
