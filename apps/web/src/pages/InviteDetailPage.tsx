import { Navigate, useParams } from "react-router-dom";

import { ActionButton, ActionLink } from "../components/Action";
import { ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import {
  appRoutes,
  buildGoalPath,
  buildInviteUnavailablePath
} from "../app/routes";
import { mapInviteDetailView } from "../features/invites/inviteViewModels";
import { useAsyncData } from "../hooks/useAsyncData";
import { isNotFoundError } from "../lib/apiErrors";

export function InviteDetailPage() {
  const api = useCrewGoalsApi();
  const { inviteId } = useParams<{ inviteId: string }>();
  const { state, reload } = useAsyncData(
    async (signal) => {
      if (!inviteId) {
        throw new Error("Missing invite id");
      }

      const invite = await api.getInvite(inviteId, signal);
      return mapInviteDetailView(invite);
    },
    [api, inviteId]
  );

  if (state.status === "loading") {
    return (
      <LoadingState
        title="Loading join goal"
        body="Checking whether this invite is joinable, blocked, or unavailable."
      />
    );
  }

  if (state.status === "error") {
    if (inviteId && isNotFoundError(state.error)) {
      return <Navigate replace to={buildInviteUnavailablePath(inviteId)} />;
    }

    return (
      <ErrorState
        title="Invite could not load"
        body="We could not determine the current availability for this invite."
        onRetry={reload}
      />
    );
  }

  if (state.data.isUnavailable) {
    return <Navigate replace to={buildInviteUnavailablePath(state.data.id)} />;
  }

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow="Join goal"
        title={state.data.title}
        description={`Invited by ${state.data.inviterName}. Only runs completed after you join will count toward this goal.`}
      />

      <section className="hero-card">
        <div className="hero-card__top">
          <p className="eyebrow">Availability</p>
          <span
            className={`pill pill--${state.data.availabilityTone === "warning" ? "warning" : "positive"}`}
          >
            {state.data.availabilityLabel}
          </span>
        </div>

        <div className="hero-card__body">
          <h1>{state.data.targetLabel}</h1>
          <p>{state.data.availabilityDescription}</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span>Duration</span>
            <strong>{state.data.durationLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Members</span>
            <strong>{state.data.currentMembersLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Joined</span>
            <strong>{state.data.joinedMembersLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Pending</span>
            <strong>{state.data.pendingInvitesLabel}</strong>
          </article>
        </div>

        <div className="inline-actions">
          {state.data.isConflict && state.data.currentUserActiveGoalId ? (
            <>
              <ActionLink block to={buildGoalPath(state.data.currentUserActiveGoalId)}>
                View current goal
              </ActionLink>
              <ActionLink block tone="secondary" to={appRoutes.invites}>
                Back to invites
              </ActionLink>
            </>
          ) : (
            <>
              <ActionButton block disabled>
                Join Goal in next phase
              </ActionButton>
              <ActionLink block tone="secondary" to={appRoutes.invites}>
                Not now
              </ActionLink>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Invite rules</p>
          <h2>What joining means</h2>
        </div>

        <div className="rule-list">
          <article className="rule-item">
            <span className="rule-item__mark">1</span>
            <p>Goal progress is asynchronous, so nobody needs to start the same run together.</p>
          </article>
          <article className="rule-item">
            <span className="rule-item__mark">2</span>
            <p>Only future Run and Trail Run activities count after the moment you join.</p>
          </article>
          <article className="rule-item">
            <span className="rule-item__mark">3</span>
            <p>{state.data.startsLabel}. {state.data.endsLabel}.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
