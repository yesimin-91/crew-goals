import {
  buildEntryOverview,
  type HomeEntryGoalCard,
  type HomeEntryResponse
} from "../../../../../packages/shared/src/index.js";

import { buildGoalProgressSummary, buildGoalTimelineSummary } from "../../lib/view-models.js";
import type { CrewGoalsReadRepository } from "../../repositories/crew-goals-read-repository.js";

export function createHomeEntryService(repository: CrewGoalsReadRepository) {
  return {
    getHomeEntry(): HomeEntryResponse {
      const base = buildEntryOverview();
      const activeGoal = repository.getActiveGoal();
      const viewer = repository.getViewer();
      const now = repository.getNow();

      if (!activeGoal) {
        return {
          ...base,
          screen: "home_entry",
          state: "no_active_goal",
          bannerLabel: "Weekly crew goal",
          primaryAction: {
            label: "Start a Goal",
            href: "/goals/create",
            kind: "primary"
          },
          secondaryAction: {
            label: "View Goals Hub",
            href: "/goals",
            kind: "ghost"
          },
          emptyState: {
            title: "Invite friends into one weekly distance target",
            body: "Crew Goals is asynchronous by design, so everyone can run on their own schedule and still move the same team forward.",
            primaryAction: {
              label: "Start a Goal",
              href: "/goals/create",
              kind: "primary"
            }
          }
        };
      }

      const activeGoalCard = buildHomeEntryGoalCard(repository, activeGoal.id);

      return {
        ...base,
        screen: "home_entry",
        state: "active_goal",
        bannerLabel: `Weekly crew goal for ${viewer.displayName}`,
        primaryAction: {
          label: "Open Goal Detail",
          href: `/goals/${activeGoal.id}`,
          kind: "primary"
        },
        secondaryAction: {
          label: "Goals Hub",
          href: "/goals",
          kind: "ghost"
        },
        activeGoal: activeGoalCard,
        headline: "Run separately. Finish together this week.",
        subheadline:
          "Your crew goal is already active, and every eligible Run or Trail Run syncs into the same 7-day distance target.",
        highlights: [
          { label: "Status", value: activeGoalCard.progress.statusLabel },
          { label: "Remaining", value: `${activeGoalCard.progress.remainingDistanceKm} km` },
          { label: "Time left", value: activeGoalCard.timeline.remainingLabel }
        ],
        rules: [
          "No need to run together. Every member contributes on their own schedule.",
          "Only runs completed after a member joins can count toward the same weekly target.",
          "The backend decides progress, availability, and timing from server-side goal windows."
        ]
      };
    }
  };
}

function buildHomeEntryGoalCard(
  repository: CrewGoalsReadRepository,
  goalId: string
): HomeEntryGoalCard {
  const goal = repository.getGoalById(goalId);

  if (!goal) {
    throw new Error(`Missing goal for home entry: ${goalId}`);
  }

  const now = repository.getNow();
  const totalDistanceKm = goal.members.reduce(
    (sum, member) => sum + member.contributionKm,
    0
  );
  const viewer = repository.getViewer();
  const myContributionKm =
    goal.members.find((member) => member.userId === viewer.id)?.contributionKm ?? 0;

  return {
    goalId: goal.id,
    title: goal.title,
    status: goal.status,
    progress: buildGoalProgressSummary({
      totalDistanceKm,
      targetDistanceKm: goal.targetDistanceKm,
      status: goal.status,
      startTime: new Date(goal.startTime),
      endTime: new Date(goal.endTime),
      now
    }),
    timeline: buildGoalTimelineSummary({
      startTime: new Date(goal.startTime),
      endTime: new Date(goal.endTime),
      now
    }),
    myContributionKm,
    crew: {
      joinedMemberCount: goal.members.length,
      pendingInviteCount: goal.pendingInvites.length,
      crewLimit: goal.crewLimit
    }
  };
}
