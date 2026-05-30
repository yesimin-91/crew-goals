import { ActionButton, ActionLink } from "./Action";

interface LoadingStateProps {
  title?: string;
  body?: string;
}

interface ErrorStateProps {
  title?: string;
  body: string;
  onRetry?: () => void;
}

interface EmptyStateProps {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel?: string;
  primaryTo?: string;
}

interface UnavailableStateProps {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export function LoadingState({
  title = "Loading crew view",
  body = "Pulling the latest goal and invite details."
}: LoadingStateProps) {
  return (
    <section className="state-card state-card--loading">
      <span className="pill">Loading</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}

export function ErrorState({
  title = "Something went off track",
  body,
  onRetry
}: ErrorStateProps) {
  return (
    <section className="state-card">
      <span className="pill pill--warning">Retry</span>
      <h2>{title}</h2>
      <p>{body}</p>
      {onRetry ? (
        <div className="inline-actions">
          <ActionButton tone="secondary" onClick={onRetry}>
            Try again
          </ActionButton>
        </div>
      ) : null}
    </section>
  );
}

export function EmptyState({
  eyebrow,
  title,
  body,
  primaryLabel,
  primaryTo
}: EmptyStateProps) {
  return (
    <section className="state-card">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
      {primaryLabel && primaryTo ? (
        <div className="inline-actions">
          <ActionLink tone="primary" to={primaryTo}>
            {primaryLabel}
          </ActionLink>
        </div>
      ) : null}
    </section>
  );
}

export function UnavailableState({
  eyebrow,
  title,
  body,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo
}: UnavailableStateProps) {
  return (
    <section className="state-card state-card--unavailable">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
      {primaryLabel && primaryTo ? (
        <div className="inline-actions">
          <ActionLink tone="primary" to={primaryTo}>
            {primaryLabel}
          </ActionLink>
          {secondaryLabel && secondaryTo ? (
            <ActionLink tone="secondary" to={secondaryTo}>
              {secondaryLabel}
            </ActionLink>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
