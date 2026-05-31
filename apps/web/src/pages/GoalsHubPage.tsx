import { ActionLink } from "../components/Action";
import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import { appRoutes, buildGoalPath } from "../app/routes";
import { mapGoalSummaryCard } from "../features/goals/goalViewModels";
import { useAsyncData } from "../hooks/useAsyncData";

export function GoalsHubPage() {
  const api = useCrewGoalsApi();
  const { state, reload } = useAsyncData(
    async (signal) => {
      const activeGoal = await api.getActiveGoalSummary(signal);
      return activeGoal ? mapGoalSummaryCard(activeGoal) : null;
    },
    [api]
  );

  if (state.status === "loading") {
    return (
      <LoadingState
        title="Loading goals hub"
        body="Checking whether you already have a live crew goal."
      />
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="Goals hub could not load"
        body="The hub needs your current active-goal state before it can decide between the summary view and the empty state."
        onRetry={reload}
      />
    );
  }

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow="Goals hub"
        title="Weekly crew goals"
        description="Phase 1 keeps the hub focused on the single active goal instead of pretending there is a broader dashboard."
      />

      {state.data ? (
        <section className="panel panel--accent goals-summary-card">
          <div className="goals-summary-card__progress">
            <div className="section-heading">
              <p className="eyebrow">Active now</p>
              <h2>{state.data.title}</h2>
            </div>

            <div className="goals-summary-card__meter">
              <p className="support-copy">{state.data.progressLabel}</p>
              <ProgressBar value={state.data.progressPercent} />
            </div>
          </div>

          <div className="metric-grid">
            <article className="metric-card">
              <span>Status</span>
              <strong>{state.data.statusLabel}</strong>
            </article>
            <article className="metric-card">
              <span>Remaining</span>
              <strong>{state.data.remainingDistanceLabel}</strong>
            </article>
            <article className="metric-card">
              <span>My distance</span>
              <strong>{state.data.myContributionLabel}</strong>
            </article>
            <article className="metric-card">
              <span>Crew</span>
              <strong>{state.data.joinedMemberCountLabel}</strong>
            </article>
            <article className="metric-card">
              <span>Pending</span>
              <strong>{state.data.pendingInviteCountLabel}</strong>
            </article>
            <article className="metric-card">
              <span>Time left</span>
              <strong>{state.data.daysLeftLabel}</strong>
            </article>
          </div>

          <div className="inline-actions">
            <ActionLink block to={buildGoalPath(state.data.id)}>
              Open goal detail
            </ActionLink>
            <ActionLink block tone="secondary" to={appRoutes.invites}>
              Review invites
            </ActionLink>
          </div>
        </section>
      ) : (
        <EmptyState
          eyebrow="No active goal"
          title="Nothing is in motion yet"
          body="Create a 7-day distance goal, invite 1 to 3 friends, and let future eligible runs move the team forward."
          primaryLabel="Start a goal"
          primaryTo={appRoutes.createGoal}
        />
      )}
    </div>
  );
}
