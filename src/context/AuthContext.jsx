import React, { createContext, useState, useEffect } from 'react';

// 1. Initialize the global storage bubble (Context instance)
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // 2. Run a check every time the app loads to see if a token exists from a prior login session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Master Admin guarantee: Platform founder is always Admin
        if (parsed?.email === 'souvikkumarbaguli51@gmail.com' || parsed?.phoneNumber === '8116860140') {
          parsed.role = 'admin';
          localStorage.setItem('user', JSON.stringify(parsed));
        }
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse cached user:', e);
        setUser(null);
      }
    }
    setLoading(false); // Stop showing the initial loader once setup check completes
  }, [token]);

  // 3. The Login Action Handler
  const login = (userData, userToken) => {
    let cleanUser = { ...userData };
    if (cleanUser?.email === 'souvikkumarbaguli51@gmail.com' || cleanUser?.phoneNumber === '8116860140') {
      cleanUser.role = 'admin';
    }
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(cleanUser));
    setToken(userToken);
    setUser(cleanUser);
  };

  // 4. The Logout Action Handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // 5. Wrap children elements inside the Provider so they all share these states
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
