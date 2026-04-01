import { createContext, useContext, useState, ReactNode } from "react";
import { PERSONAS, Persona, PersonaId } from "./personas";

interface PersonaContextValue {
  persona: Persona;
  setPersonaId: (id: PersonaId) => void;
}

const PersonaContext = createContext<PersonaContextValue>({
  persona: PERSONAS[0],
  setPersonaId: () => {},
});

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<PersonaId>("architect");
  const persona = PERSONAS.find(p => p.id === personaId) || PERSONAS[0];
  return (
    <PersonaContext.Provider value={{ persona, setPersonaId }}>
      {children}
    </PersonaContext.Provider>
  );
}

export const usePersona = () => useContext(PersonaContext);
