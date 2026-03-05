const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

export type RepoConfig = {
  owner: string;
  repo: string;
  posting_mode: 'preview' | 'comment' | 'check_run';
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  rules: Record<string, { enabled: boolean; max_findings?: number }>;
};

export type DashboardMetrics = {
  from: string;
  to: string;
  bucket: 'day' | 'week';
  series: Array<{
    period_start: string;
    prs_analyzed: number;
    suggestions_posted: number;
    accept_rate: number;
  }>;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function getRepoConfig(owner: string, repo: string) {
  return request<RepoConfig>(`/repos/${owner}/${repo}/config`);
}

export function triggerAnalysis(owner: string, repo: string, body: { pr_number: number; mode: 'quick' | 'full' }) {
  return request<{ analysis_id: string; status: string }>(`/repos/${owner}/${repo}/analyze`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function submitFeedback(body: {
  analysis_id: string;
  suggestion_id: string;
  action: 'accept' | 'reject';
  reason_code: string;
  source: 'app_ui';
}) {
  return request<{ feedback_id: string }>(`/feedback`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function getDashboardMetrics(params: {
  from: string;
  to: string;
  bucket: 'day' | 'week';
  owner?: string;
  repo?: string;
}) {
  const q = new URLSearchParams({
    from: params.from,
    to: params.to,
    bucket: params.bucket,
    ...(params.owner ? { owner: params.owner } : {}),
    ...(params.repo ? { repo: params.repo } : {})
  });
  return request<DashboardMetrics>(`/dashboard/metrics?${q.toString()}`);
}
