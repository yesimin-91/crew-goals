import { ActionLink } from "../components/Action";
import { ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import { appRoutes, buildGoalPath } from "../app/routes";
import { mapPostRunContributionView } from "../features/contributions/postRunViewModels";
import { useAsyncData } from "../hooks/useAsyncData";
import { useParams } from "react-router-dom";

function getStateMark(state: ReturnType<typeof mapPostRunContributionView>["state"]) {
  switch (state) {
    case "counted":
      return "+";
    case "already_counted":
      return "=";
    case "goal_locked":
      return "!";
    case "not_counted":
      return "x";
    case "updating":
      return "...";
  }
}

export function PostRunPage() {
  const api = useCrewGoalsApi();
  const { activityId } = useParams<{ activityId: string }>();
  const { state, reload } = useAsyncData(
    async (signal) => {
      if (!activityId) {
        throw new Error("Missing activity id");
      }

      const contribution = await api.getPostRunContribution(activityId, signal);
      return mapPostRunContributionView(contribution);
    },
    [api, activityId]
  );

  if (state.status === "loading") {
    return (
      <LoadingState
        title="Checking post-run progress"
        body="Looking for the latest contribution decision for this activity."
      />
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="Post-run card could not load"
        body="We could not fetch the contribution state for this activity."
        onRetry={reload}
      />
    );
  }

  const view = state.data;

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow="Post-run"
        title="Contribution card"
        description="This page only explains whether this activity counted toward Crew Goals. Route, pace, heart rate, and notes stay private."
      />

      <section className={`hero-card post-run-card post-run-card--${view.state}`}>
        <div className="hero-card__top">
          <p className="eyebrow">{view.eyebrow}</p>
          <span className={`pill pill--${view.tone}`}>{view.label}</span>
        </div>

        <div className="post-run-card__summary">
          <div className="post-run-card__mark" aria-hidden="true">
            {getStateMark(view.state)}
          </div>

          <div className="hero-card__body">
            <h1>{view.title}</h1>
            <p>{view.body}</p>
          </div>
        </div>

        {view.syncedDistanceLabel ? (
          <div className="metric-grid post-run-card__metrics">
            <article className="metric-card">
              <span>This activity</span>
              <strong>{view.syncedDistanceLabel}</strong>
            </article>
            <article className="metric-card">
              <span>Decision</span>
              <strong>{view.label}</strong>
            </article>
          </div>
        ) : null}

        {view.goal ? (
          <p className="support-copy">
            {view.goal.totalDistanceLabel} total, {view.goal.remainingDistanceLabel} left.
          </p>
        ) : null}
      </section>

      {view.goal ? (
        <section className="panel post-run-goal-card">
          <div className="post-run-goal-card__intro">
            <div className="section-heading">
              <p className="eyebrow">Crew goal</p>
              <h2>{view.goal.title}</h2>
            </div>

            <div className="post-run-goal-card__progress">
              <p className="support-copy">{view.goal.progressLabel}</p>
              <ProgressBar value={view.goal.progressPercent} />
            </div>
          </div>

          <div className="metric-grid post-run-goal-card__metrics">
            <article className="metric-card">
              <span>Progress</span>
              <strong>{view.goal.progressPercentLabel}</strong>
            </article>
            <article className="metric-card">
              <span>Remaining</span>
              <strong>{view.goal.remainingDistanceLabel}</strong>
            </article>
            <article className="metric-card">
              <span>Target</span>
              <strong>{view.goal.targetDistanceLabel}</strong>
            </article>
            <article className="metric-card">
              <span>Status</span>
              <strong>{view.goal.resultLockedLabel ?? view.goal.status}</strong>
            </article>
          </div>

          <div className="inline-actions">
            <ActionLink block to={buildGoalPath(view.goal.id)}>
              Open goal detail
            </ActionLink>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">No active goal attached</p>
            <h2>Start a crew goal for future runs</h2>
          </div>
          <p className="support-copy">
            If you do not have an active Crew Goal, future eligible activities can start counting after you create or join one.
          </p>
          <div className="inline-actions">
            <ActionLink block to={appRoutes.createGoal}>
              Start a goal
            </ActionLink>
            <ActionLink block tone="secondary" to={appRoutes.goals}>
              View goals
            </ActionLink>
          </div>
        </section>
      )}

      {view.showRetryHint ? (
        <section className="panel panel--compact">
          <p className="support-copy">
            Sync can take a moment. Try again after the activity finishes processing.
          </p>
          <div className="inline-actions">
            <button className="action action--secondary action--block" type="button" onClick={reload}>
              Check again
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
