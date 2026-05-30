import { createContext, useContext } from "react";

import { defaultCrewGoalsApi } from "../services/crewGoalsApi";
import type { CrewGoalsApi } from "../services/crewGoalsApi";

const CrewGoalsApiContext = createContext<CrewGoalsApi>(defaultCrewGoalsApi);

interface CrewGoalsApiProviderProps {
  api?: CrewGoalsApi;
  children: React.ReactNode;
}

export function CrewGoalsApiProvider({
  api = defaultCrewGoalsApi,
  children
}: CrewGoalsApiProviderProps) {
  return (
    <CrewGoalsApiContext.Provider value={api}>{children}</CrewGoalsApiContext.Provider>
  );
}

export function useCrewGoalsApi() {
  return useContext(CrewGoalsApiContext);
}
