import { createContext, useContext } from 'react';

const ReelsNavContext = createContext(null);

export function ReelsNavProvider({ children, openUserProfile }) {
  return (
    <ReelsNavContext.Provider value={{ openUserProfile }}>
      {children}
    </ReelsNavContext.Provider>
  );
}

export function useReelsNav() {
  const ctx = useContext(ReelsNavContext);
  return ctx ?? { openUserProfile: null };
}
