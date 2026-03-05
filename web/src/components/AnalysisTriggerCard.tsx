type Props = {
  onAnalyze: () => void;
  loading: boolean;
};

export function AnalysisTriggerCard({ onAnalyze, loading }: Props) {
  return (
    <div className="panel">
      <h2>Analyze Pull Request</h2>
      <p>Run hybrid static analysis + AI review for PR #42 and publish top inline suggestions.</p>
      <button onClick={onAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Run AI Review'}
      </button>
    </div>
  );
}
