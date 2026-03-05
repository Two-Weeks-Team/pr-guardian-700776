"use client";

import { useEffect, useState } from 'react';
import { getDashboardMetrics, getRepoConfig, triggerAnalysis, submitFeedback, type DashboardMetrics, type RepoConfig } from '@/lib/api';
import { AnalysisTriggerCard } from '@/components/AnalysisTriggerCard';
import { RepoConfigPanel } from '@/components/RepoConfigPanel';
import { SuggestionsTable } from '@/components/SuggestionsTable';

type LocalSuggestion = {
  suggestion_id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'security' | 'performance' | 'style';
  file_path: string;
  line: number;
  confidence: number;
};

const owner = 'acme';
const repo = 'payments-api';

export default function Page() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [config, setConfig] = useState<RepoConfig | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [suggestions] = useState<LocalSuggestion[]>([
    {
      suggestion_id: 'sg_1',
      title: 'Parameterize SQL query to prevent injection',
      severity: 'critical',
      category: 'security',
      file_path: 'src/db/query.ts',
      line: 88,
      confidence: 0.92
    },
    {
      suggestion_id: 'sg_2',
      title: 'Avoid N+1 pattern in user listing endpoint',
      severity: 'high',
      category: 'performance',
      file_path: 'src/services/users.ts',
      line: 44,
      confidence: 0.84
    }
  ]);

  useEffect(() => {
    async function load() {
      const [m, c] = await Promise.all([
        getDashboardMetrics({ from: '2026-02-01T00:00:00Z', to: '2026-03-01T00:00:00Z', bucket: 'week', owner, repo }),
        getRepoConfig(owner, repo)
      ]);
      setMetrics(m);
      setConfig(c);
    }
    load().catch(() => setStatus('Failed to load backend data.'));
  }, []);

  const onAnalyze = async () => {
    setLoading(true);
    setStatus('Queuing PR analysis...');
    try {
      const result = await triggerAnalysis(owner, repo, { pr_number: 42, mode: 'full' });
      setStatus(`Analysis queued: ${result.analysis_id}`);
    } catch {
      setStatus('Failed to trigger analysis.');
    } finally {
      setLoading(false);
    }
  };

  const onFeedback = async (suggestionId: string, action: 'accept' | 'reject') => {
    try {
      await submitFeedback({
        analysis_id: 'f0c2f2b6-9b9c-4c65-8e7d-1b3ad2a9b1b0',
        suggestion_id: suggestionId,
        action,
        reason_code: action === 'reject' ? 'false_positive' : 'other',
        source: 'app_ui'
      });
      setStatus(`Feedback recorded for ${suggestionId}: ${action}`);
    } catch {
      setStatus('Failed to submit feedback.');
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>PR Guardian</h1>
        <p>AI-powered bug, security, and performance reviews directly in GitHub pull requests.</p>
      </header>

      <section className="grid">
        <AnalysisTriggerCard onAnalyze={onAnalyze} loading={loading} />

        <div className="panel">
          <h2>Quality Snapshot</h2>
          <div className="stats-row">
            <div>
              <span>PRs analyzed</span>
              <strong>{metrics?.series?.[0]?.prs_analyzed ?? '--'}</strong>
            </div>
            <div>
              <span>Suggestions posted</span>
              <strong>{metrics?.series?.[0]?.suggestions_posted ?? '--'}</strong>
            </div>
            <div>
              <span>Accept rate</span>
              <strong>{metrics?.series?.[0]?.accept_rate != null ? `${Math.round(metrics.series[0].accept_rate * 100)}%` : '--'}</strong>
            </div>
          </div>
        </div>
      </section>

      {config && <RepoConfigPanel config={config} />}

      <SuggestionsTable suggestions={suggestions} onFeedback={onFeedback} />

      {status && <p className="status">{status}</p>}
    </div>
  );
}
