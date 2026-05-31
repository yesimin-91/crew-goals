import { ActionLink } from "../components/Action";
import { ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import { appRoutes, buildGoalPath, buildRestartGoalPath } from "../app/routes";
import { mapGoalResultView } from "../features/results/resultViewModels";
import { useAsyncData } from "../hooks/useAsyncData";
import { isNotFoundError } from "../lib/apiErrors";
import { useParams } from "react-router-dom";

export function GoalResultPage() {
  const api = useCrewGoalsApi();
  const { goalId, status } = useParams<{ goalId: string; status: "completed" | "expired" }>();
  const { state, reload } = useAsyncData(
    async (signal) => {
      if (!goalId) {
        throw new Error("Missing goal id");
      }

      const result = await api.getGoalResult(goalId, signal);
      if (status && result.status !== status) {
        throw new Error(`Expected ${status} result, received ${result.status}`);
      }

      return mapGoalResultView(result);
    },
    [api, goalId, status]
  );

  if (state.status === "loading") {
    return (
      <LoadingState
        title="Loading goal result"
        body="Fetching the locked result, team contribution, and restart options."
      />
    );
  }

  if (state.status === "error") {
    if (isNotFoundError(state.error)) {
      return (
        <ErrorState
          title="Result unavailable"
          body="This goal result is not available yet or no longer exists."
          onRetry={reload}
        />
      );
    }

    return (
      <ErrorState
        title="Result page could not load"
        body="We could not fetch the locked result for this goal."
        onRetry={reload}
      />
    );
  }

  const view = state.data;
  const restartTo = buildRestartGoalPath(
    view.members.filter((member) => member.id !== view.currentUserId).map((member) => member.id)
  );
  const getActionHref = (href: string) =>
    href === "/goals/create" ? restartTo : href;

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow={view.eyebrow}
        title={view.headline}
        description={view.body}
      />

      <section className={`hero-card result-card result-card--${view.status}`}>
        <div className="hero-card__top">
          <p className="eyebrow">Locked result</p>
          <span className={`pill pill--${view.tone}`}>{view.badge}</span>
        </div>

        <div className="hero-card__body">
          <h1>{view.summaryLabel}</h1>
          <p>{view.daysUsedLabel}</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span>Final distance</span>
            <strong>{view.summaryLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Locked</span>
            <strong>{view.lockedAtLabel}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Members</p>
          <h2>Team contributions</h2>
        </div>

        <div className="stack-list">
          {view.members.map((member) => (
            <article className="list-card" key={member.id}>
              <div className="avatar-row">
                <span className="avatar">{member.initials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.label}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="inline-actions">
          <ActionLink block to={getActionHref(view.primaryAction.href)}>
            {view.primaryAction.label}
          </ActionLink>
          {view.secondaryAction ? (
            <ActionLink block tone="secondary" to={getActionHref(view.secondaryAction.href)}>
              {view.secondaryAction.label}
            </ActionLink>
          ) : null}
          <ActionLink block tone="secondary" to={buildGoalPath(view.id)}>
            Open goal detail
          </ActionLink>
          <ActionLink block tone="secondary" to={appRoutes.goals}>
            Back to goals
          </ActionLink>
        </div>
      </section>
    </div>
  );
}
