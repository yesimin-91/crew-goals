import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { App } from "./App";
import { CrewGoalsApiProvider } from "./app/CrewGoalsApiContext";
import { CreateGoalPage } from "./pages/CreateGoalPage";
import { GoalDetailPage } from "./pages/GoalDetailPage";
import { GoalResultPage } from "./pages/GoalResultPage";
import { GoalsHubPage } from "./pages/GoalsHubPage";
import { HomePage } from "./pages/HomePage";
import { InviteDetailPage } from "./pages/InviteDetailPage";
import { InviteUnavailablePage } from "./pages/InviteUnavailablePage";
import { InvitesPage } from "./pages/InvitesPage";
import { PostRunPage } from "./pages/PostRunPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <CrewGoalsApiProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="goals" element={<GoalsHubPage />} />
            <Route path="goals/create" element={<CreateGoalPage />} />
            <Route path="goals/friends" element={<CreateGoalPage />} />
            <Route path="goals/preview" element={<CreateGoalPage />} />
            <Route path="goals/:goalId" element={<GoalDetailPage />} />
            <Route path="invites" element={<InvitesPage />} />
            <Route path="invites/:inviteId" element={<InviteDetailPage />} />
            <Route
              path="invites/:inviteId/unavailable"
              element={<InviteUnavailablePage />}
            />
            <Route path="post-run/:activityId" element={<PostRunPage />} />
            <Route path="results/:goalId/:status" element={<GoalResultPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CrewGoalsApiProvider>
  </React.StrictMode>,
);
