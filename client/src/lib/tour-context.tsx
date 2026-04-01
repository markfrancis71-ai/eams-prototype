import { createContext, useContext, useState, ReactNode } from "react";

interface TourContextValue {
  tourActive: boolean;
  startTour: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tourActive: false,
  startTour: () => {},
  endTour: () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const [tourActive, setTourActive] = useState(false);
  return (
    <TourContext.Provider value={{
      tourActive,
      startTour: () => setTourActive(true),
      endTour: () => setTourActive(false),
    }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);
