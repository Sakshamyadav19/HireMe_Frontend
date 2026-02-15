export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function messageFromDetail(detail: unknown): string {
  if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object" && "msg" in detail[0]) {
    return String((detail[0] as { msg: string }).msg);
  }
  if (typeof detail === "string") return detail;
  return "Request failed";
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, messageFromDetail(data.detail) || data.error || "Something went wrong");
  }

  return data as T;
}

/** File upload: do not set Content-Type so browser sends multipart/form-data with boundary */
async function uploadRequest<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
    headers: {},
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, messageFromDetail(data.detail) || data.error || "Upload failed");
  }

  return data as T;
}

export const authApi = {
  register(body: { name: string; email: string; password: string }) {
    return request<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  login(body: { email: string; password: string }) {
    return request<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  me() {
    return request<{ user: AuthUser }>("/api/auth/me");
  },

  logout() {
    return request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  },
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// ─── Match API (resume upload + job matches) ───

export interface JobSummary {
  id: string;
  title: string;
  company_name: string;
  domain: string;
  subdomain: string;
  location: string;
  remote: string;
  salary_min: number | null;
  salary_max: number | null;
  skills_required: string[];
  years_experience_min: number;
  years_experience_max: number;
}

export interface ScoreBreakdown {
  skills: number;
  semantic: number;
  yoe: number;
}

export interface MatchExplanation {
  matched_skills: string[];
  missing_required: string[];
  summary: string;
}

export interface MatchResult {
  job: JobSummary;
  score: number;
  breakdown: ScoreBreakdown;
  explanation: MatchExplanation;
}

export interface MatchResponse {
  candidate_profile_id: string;
  total_matches: number;
  matches: MatchResult[];
}

export interface MatchResultsCursorResponse {
  total_matches: number;
  matches: MatchResult[];
  next_cursor: string | null;
  prev_cursor: string | null;
}

export interface MatchJobAcceptedResponse {
  job_id: string;
}

export interface MatchJobStatusResponse {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  error: string | null;
}

export const matchApi = {
  /** Upload resume and enqueue background match job. Returns 202 with job_id; poll getMatchJobStatus until completed/failed. */
  uploadResume(file: File): Promise<MatchJobAcceptedResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return uploadRequest<MatchJobAcceptedResponse>("/api/match/upload", formData);
  },

  /** Get status of a match job. 404 if not found or not owned. */
  getMatchJobStatus(jobId: string): Promise<MatchJobStatusResponse> {
    return request<MatchJobStatusResponse>(`/api/match/status/${encodeURIComponent(jobId)}`);
  },

  /** Get one page of latest match results (cursor-based). 404 if no result. */
  getResultsPage(params: {
    cursor?: string;
    limit?: number;
    dir: "next" | "prev";
  }): Promise<MatchResultsCursorResponse> {
    const search = new URLSearchParams();
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit != null) search.set("limit", String(params.limit));
    search.set("dir", params.dir);
    const qs = search.toString();
    return request<MatchResultsCursorResponse>(`/api/match/results${qs ? `?${qs}` : ""}`);
  },
};

// ─── Jobs API (list/browse) ───

export interface JobResponse {
  id: string;
  title: string;
  company_name: string;
  description: string;
  source: string;
  domain: string;
  subdomain: string;
  years_experience_min: number;
  years_experience_max: number;
  skills_required: string[];
  location: string;
  remote: string;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobListCursorResponse {
  jobs: JobResponse[];
  next_cursor: string | null;
  prev_cursor: string | null;
}

export const jobsApi = {
  listJobsCursor(params?: {
    cursor?: string;
    dir?: "next" | "prev";
    limit?: number;
    domain?: string;
  }): Promise<JobListCursorResponse> {
    const search = new URLSearchParams();
    if (params?.cursor) search.set("cursor", params.cursor);
    if (params?.dir) search.set("dir", params.dir);
    if (params?.limit != null) search.set("limit", String(params.limit));
    if (params?.domain) search.set("domain", params.domain);
    const qs = search.toString();
    return request<JobListCursorResponse>(`/api/jobs${qs ? `?${qs}` : ""}`);
  },

  getJob(id: string): Promise<JobResponse> {
    return request<JobResponse>(`/api/jobs/${id}`);
  },
};

// ─── Saved jobs API (auth required) ───

export const savedJobsApi = {
  add(jobId: string): Promise<{ message: string }> {
    return request<{ message: string }>("/api/saved-jobs", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId }),
    });
  },

  remove(jobId: string): Promise<void> {
    return fetch(`/api/saved-jobs/${encodeURIComponent(jobId)}`, {
      method: "DELETE",
      credentials: "include",
    }).then((res) => {
      if (!res.ok) return res.json().then((data) => { throw new ApiError(res.status, messageFromDetail(data.detail) || "Failed to remove"); });
      return undefined;
    });
  },

  list(): Promise<{ jobs: JobResponse[] }> {
    return request<{ jobs: JobResponse[] }>("/api/saved-jobs");
  },
};
