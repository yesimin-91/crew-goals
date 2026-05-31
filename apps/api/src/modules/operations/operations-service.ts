import type {
  CrewGoalAnalyticsEventRequest,
  CrewGoalAnalyticsEventRecord,
  CrewGoalNotificationPreviewRequest,
  CrewGoalNotificationPreviewResponse
} from "../../../../../packages/shared/src/index.js";

import type { CrewGoalsReadRepository, CrewGoalsWriteRepository } from "../../repositories/crew-goals-read-repository.js";

export function createOperationsService(repository: CrewGoalsWriteRepository) {
  return {
    recordAnalyticsEvent(request: CrewGoalAnalyticsEventRequest): CrewGoalAnalyticsEventRecord {
      const eventId = buildEventId(repository.getNow(), request.eventName, request.goalId);
      const createdAt = repository.getNow().toISOString();

      repository.recordAnalyticsEvent({
        eventId,
        eventName: request.eventName,
        source: request.source,
        goalId: request.goalId,
        userId: request.userId ?? repository.getViewer().id,
        properties: request.properties ?? {},
        createdAt
      });

      return {
        eventId,
        eventName: request.eventName,
        source: request.source,
        goalId: request.goalId,
        userId: request.userId ?? repository.getViewer().id,
        properties: request.properties ?? {},
        createdAt
      };
    },

    previewNotification(
      request: CrewGoalNotificationPreviewRequest,
      readRepository: CrewGoalsReadRepository
    ): CrewGoalNotificationPreviewResponse {
      const goal = readRepository.getGoalById(request.goalId);

      if (!goal) {
        throw new Error(`Goal ${request.goalId} was not found`);
      }

      const recipientId = request.recipientId ?? goal.creatorId;
      const recipient = readRepository.getUserById(recipientId);
      const createdAt = repository.getNow().toISOString();
      const payload = buildNotificationPreview(request.trigger, goal.title, recipient.displayName, goal.id);

      return {
        screen: "notification_preview",
        trigger: request.trigger,
        channel: request.trigger === "goal_24h_left" ? "push" : "in_app",
        goalId: goal.id,
        recipientId: recipient.id,
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink,
        createdAt
      };
    }
  };
}

function buildEventId(now: Date, eventName: string, goalId?: string) {
  const suffix = goalId ? goalId.slice(-8) : "global";
  return `evt_${eventName}_${suffix}_${now.getTime()}`;
}

function buildNotificationPreview(
  trigger: CrewGoalNotificationPreviewRequest["trigger"],
  goalTitle: string,
  recipientName: string,
  goalId: string
) {
  switch (trigger) {
    case "invite_sent":
      return {
        title: `${recipientName}, you have a new Crew Goal invite`,
        body: `${goalTitle} is ready to join now.`,
        deepLink: `/invites/${goalId}`
      };
    case "invite_accepted":
      return {
        title: `${recipientName} joined your Crew Goal`,
        body: `Your crew can keep building toward ${goalTitle}.`,
        deepLink: `/goals/${goalId}`
      };
    case "goal_24h_left":
      return {
        title: `24h left to finish this week`,
        body: `${goalTitle} is almost done. Keep the team moving.`,
        deepLink: `/goals/${goalId}`
      };
    case "goal_completed":
      return {
        title: "Your Crew Goal is complete",
        body: `${goalTitle} reached the target distance.`,
        deepLink: `/results/${goalId}/completed`
      };
    case "goal_expired":
      return {
        title: "Your Crew Goal ended",
        body: `Start another week together with ${goalTitle}.`,
        deepLink: `/results/${goalId}/expired`
      };
  }
}
