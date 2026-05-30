interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="progress-bar" aria-hidden="true">
      <span className="progress-bar__fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
