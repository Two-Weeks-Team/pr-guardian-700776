type Suggestion = {
  suggestion_id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'security' | 'performance' | 'style';
  file_path: string;
  line: number;
  confidence: number;
};

export function SuggestionsTable({
  suggestions,
  onFeedback
}: {
  suggestions: Suggestion[];
  onFeedback: (suggestionId: string, action: 'accept' | 'reject') => void;
}) {
  return (
    <section className="panel">
      <h2>AI Suggestions (Current PR)</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Location</th>
            <th>Severity</th>
            <th>Confidence</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map((s) => (
            <tr key={s.suggestion_id}>
              <td>{s.title}<br /><small>{s.category}</small></td>
              <td>{s.file_path}:{s.line}</td>
              <td><span className={`badge ${s.severity}`}>{s.severity}</span></td>
              <td>{Math.round(s.confidence * 100)}%</td>
              <td>
                <button className="secondary" onClick={() => onFeedback(s.suggestion_id, 'accept')}>Accept</button>{' '}
                <button className="secondary" onClick={() => onFeedback(s.suggestion_id, 'reject')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
