import type { RepoConfig } from '@/lib/api';

export function RepoConfigPanel({ config }: { config: RepoConfig }) {
  return (
    <section className="panel">
      <h2>Repository Policy</h2>
      <p>
        <strong>{config.owner}/{config.repo}</strong> · mode: <strong>{config.posting_mode}</strong> · threshold: <strong>{config.severity_threshold}</strong>
      </p>
      <ul>
        {Object.entries(config.rules).map(([key, value]) => (
          <li key={key}>
            {key}: {value.enabled ? 'enabled' : 'disabled'}
            {value.max_findings ? ` (max ${value.max_findings})` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
