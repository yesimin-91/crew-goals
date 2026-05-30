import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import { appRoutes } from "../app/routes";
import { mapGoalDetailView } from "../features/goals/goalViewModels";
import { useAsyncData } from "../hooks/useAsyncData";
import { isNotFoundError } from "../lib/apiErrors";
import { useParams } from "react-router-dom";

export function GoalDetailPage() {
  const api = useCrewGoalsApi();
  const { goalId } = useParams<{ goalId: string }>();
  const { state, reload } = useAsyncData(
    async (signal) => {
      if (!goalId) {
        throw new Error("Missing goal id");
      }

      const [goal, activities] = await Promise.all([
        api.getGoalDetail(goalId, signal),
        api.getRecentActivities(goalId, signal)
      ]);

      return mapGoalDetailView(goal, activities);
    },
    [api, goalId]
  );

  if (state.status === "loading") {
    return (
      <LoadingState
        title="Loading goal detail"
        body="Pulling team progress, member contributions, and recent activity."
      />
    );
  }

  if (state.status === "error") {
    if (isNotFoundError(state.error)) {
      return (
        <EmptyState
          eyebrow="Goal unavailable"
          title="This goal is no longer here"
          body="The detail route now keeps a dedicated unavailable state instead of dropping you back into a generic landing view."
          primaryLabel="Back to goals"
          primaryTo={appRoutes.goals}
        />
      );
    }

    return (
      <ErrorState
        title="Goal detail could not load"
        body="We could not fetch the current goal detail or recent contributions."
        onRetry={reload}
      />
    );
  }

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow="Goal detail"
        title={state.data.title}
        description="Team progress stays first, with member contributions and recent activity underneath."
      />

      <section className="hero-card">
        <div className="hero-card__top">
          <p className="eyebrow">Team progress</p>
          <span className="pill pill--positive">{state.data.statusLabel}</span>
        </div>

        <div className="hero-card__body">
          <h1>{state.data.progressPercentLabel}</h1>
          <p>{state.data.progressLabel}</p>
        </div>

        <ProgressBar value={state.data.progressPercent} />

        <div className="metric-grid">
          <article className="metric-card">
            <span>Remaining</span>
            <strong>{state.data.remainingDistanceLabel}</strong>
          </article>
          <article className="metric-card">
            <span>My contribution</span>
            <strong>{state.data.myContributionLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Days left</span>
            <strong>{state.data.daysLeftLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Timeline</span>
            <strong>{state.data.timelineLabel}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Crew</p>
          <h2>Members and invites</h2>
        </div>

        <p className="support-copy">{state.data.crewSizeLabel}</p>

        <div className="stack-list">
          {state.data.members.map((member) => (
            <article className="list-card" key={member.id}>
              <div className="avatar-row">
                <span className="avatar">{member.initials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.roleLabel}</p>
                </div>
              </div>
              <span className="list-card__value">{member.contributionLabel}</span>
            </article>
          ))}
        </div>

        {state.data.pendingInvites.length ? (
          <div className="subsection">
            <h3>Pending invites</h3>
            <div className="stack-list">
              {state.data.pendingInvites.map((invite) => (
                <article className="list-card" key={invite.id}>
                  <div className="avatar-row">
                    <span className="avatar avatar--muted">{invite.initials}</span>
                    <div>
                      <strong>{invite.name}</strong>
                      <p>{invite.invitedLabel}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Recent activity</p>
          <h2>Last synced contributions</h2>
        </div>

        {state.data.recentActivities.length ? (
          <div className="stack-list">
            {state.data.recentActivities.map((activity) => (
              <article className="list-card" key={activity.id}>
                <div className="avatar-row">
                  <span className="avatar">{activity.athleteInitials}</span>
                  <div>
                    <strong>{activity.headline}</strong>
                    <p>{activity.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="info-card">
            <span>Ready to move</span>
            <strong>Your goal has started</strong>
            <p>The first eligible run will move the team forward.</p>
          </article>
        )}
      </section>
    </div>
  );
}
