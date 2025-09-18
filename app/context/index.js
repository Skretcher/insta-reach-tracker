//app/context/index.js
import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [media, setMedia] = useState([]);

  return (
    <AppContext.Provider value={{ accessToken, setAccessToken, media, setMedia }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppProvider; // Add default export to fix Expo Router warning
