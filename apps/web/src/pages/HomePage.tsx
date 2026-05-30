import { ActionLink } from "../components/Action";
import { ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import { appRoutes, buildGoalPath } from "../app/routes";
import type { HomeEntryView } from "../features/home/homeViewModels";
import { mapHomeEntryView } from "../features/home/homeViewModels";
import { useAsyncData } from "../hooks/useAsyncData";
import { fallbackOverview } from "../services/homeService";

async function loadHomeEntryView(
  signal: AbortSignal,
  getHomeEntryOverview: ReturnType<typeof useCrewGoalsApi>["getHomeEntryOverview"],
  getActiveGoalSummary: ReturnType<typeof useCrewGoalsApi>["getActiveGoalSummary"]
) {
  const [overviewResult, activeGoalResult] = await Promise.allSettled([
    getHomeEntryOverview(signal),
    getActiveGoalSummary(signal)
  ]);

  if (activeGoalResult.status === "rejected") {
    throw activeGoalResult.reason;
  }

  const overview =
    overviewResult.status === "fulfilled" ? overviewResult.value : fallbackOverview;

  return mapHomeEntryView(overview, activeGoalResult.value);
}

function ActiveGoalHome({ view }: { view: HomeEntryView }) {
  if (!view.activeGoal) {
    return null;
  }

  return (
    <>
      <PageHeader
        eyebrow="Home"
        title="Your weekly crew goal is active"
        description="Home now branches to the live goal summary so you can jump straight back into progress."
      />

      <section className="hero-card">
        <div className="hero-card__top">
          <p className="eyebrow">Active goal</p>
          <span className="pill pill--positive">{view.activeGoal.statusLabel}</span>
        </div>

        <div className="hero-card__body">
          <h1>{view.activeGoal.title}</h1>
          <p>{view.activeGoal.progressLabel}</p>
        </div>

        <ProgressBar value={view.activeGoal.progressPercent} />

        <div className="metric-grid">
          <article className="metric-card">
            <span>Progress</span>
            <strong>{view.activeGoal.progressPercentLabel}</strong>
          </article>
          <article className="metric-card">
            <span>My contribution</span>
            <strong>{view.activeGoal.myContributionLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Days left</span>
            <strong>{view.activeGoal.daysLeftLabel}</strong>
          </article>
        </div>

        <div className="inline-actions">
          <ActionLink block to={buildGoalPath(view.activeGoal.id)}>
            View current goal
          </ActionLink>
          <ActionLink block tone="secondary" to={appRoutes.invites}>
            Review invites
          </ActionLink>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">What stays visible</p>
          <h2>Current goal context</h2>
        </div>

        <div className="stack-list">
          <article className="info-card">
            <span>Remaining</span>
            <strong>{view.activeGoal.remainingDistanceLabel}</strong>
            <p>The detail page carries the full member list, pending invites, and latest contributions.</p>
          </article>
          <article className="info-card">
            <span>Crew</span>
            <strong>{view.activeGoal.joinedMemberCountLabel}</strong>
            <p>{view.activeGoal.pendingInviteCountLabel} stay attached to the active goal instead of drifting into a generic home state.</p>
          </article>
        </div>
      </section>
    </>
  );
}

function NoActiveGoalHome({ view }: { view: HomeEntryView }) {
  return (
    <>
      <PageHeader
        eyebrow="Home"
        title={view.overview.headline}
        description={view.overview.subheadline}
      />

      <section className="hero-card">
        <div className="hero-card__top">
          <p className="eyebrow">No active goal</p>
          <span className="pill">Read flow</span>
        </div>

        <div className="hero-card__body">
          <h1>Weekly goal entry</h1>
          <p>Home now routes people toward the goals hub when there is nothing active, instead of holding them on a static landing page.</p>
        </div>

        <div className="metric-grid">
          {view.overview.highlights.map((item) => (
            <article className="metric-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className="inline-actions">
          <ActionLink block to={appRoutes.goals}>
            Open goals hub
          </ActionLink>
          <ActionLink block tone="secondary" to={appRoutes.invites}>
            Check invites
          </ActionLink>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Ground rules</p>
          <h2>What Phase 1 needs to keep true</h2>
        </div>

        <div className="rule-list">
          {view.overview.rules.map((rule) => (
            <article className="rule-item" key={rule}>
              <span className="rule-item__mark">✓</span>
              <p>{rule}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function HomePage() {
  const api = useCrewGoalsApi();
  const { state, reload } = useAsyncData(
    (signal) =>
      loadHomeEntryView(signal, api.getHomeEntryOverview, api.getActiveGoalSummary),
    [api]
  );

  if (state.status === "loading") {
    return (
      <LoadingState
        title="Loading home"
        body="Checking your current goal and home entry copy."
      />
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="Home could not load"
        body="We could not confirm whether you already have an active goal. Try again to restore the correct entry state."
        onRetry={reload}
      />
    );
  }

  return (
    <div className="app-screen">
      {state.data.activeGoal ? (
        <ActiveGoalHome view={state.data} />
      ) : (
        <NoActiveGoalHome view={state.data} />
      )}
    </div>
  );
}
