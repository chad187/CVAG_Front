import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './components/Login';
import Yards from './components/Yards';
import Nodes from './components/Nodes';
import SysAdmin from './components/SysAdmin';
import AllYards from './components/AllYards';
import AllNodes from './components/AllNodes';
import AllCompanies from './components/AllCompanies';
import NodeDetails from './components/NodeDetails';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

const IS_PRODUCTION = import.meta.env.VITE_IN_PRODUCTION === 'true';

// =========================================================================
// CRITICAL FIX: Intercept the URL token immediately when the script loads, 
// BEFORE the React component tree renders and redirects you away.
// =========================================================================
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');

if (tokenFromUrl) {
  console.debug('[App Boot] Found token parameter in URL window. Injecting into state immediately.');
  // Safely seed the store data layer directly before boot operations mount
  useAuthStore.getState().setToken(tokenFromUrl);
  // Clear the URL string cleanly so the user doesn't see the raw token string
  window.history.replaceState({}, document.title, window.location.pathname);
}
// =========================================================================

const App: React.FC = () => {
  const { token, user, isLoading, checkAuth } = useAuthStore();
  const authInitialized = useRef(false);

  useEffect(() => {
    // Only verify profile settings once on mount
    if (authInitialized.current) return;
    authInitialized.current = true;

    console.debug('[App Mount] State profile verification check:', { token: !!token, user: !!user, isLoading });

    // If we successfully caught a token but don't have the profile user data yet, fetch it
    if (IS_PRODUCTION && token && !user && !isLoading) {
      console.debug('[App Mount] Querying user profile configuration data via checkAuth');
      checkAuth();
    }
  }, [token, user, isLoading, checkAuth]);

  // Determine if the profile layer is actively resolving network data on boot up
  const isProfileResolving = IS_PRODUCTION && !!token && !user;

  // Keep your structural production auth rules pristine
  const isAuthenticated = IS_PRODUCTION ? (!!token && !!user) : true;

  // =========================================================================
  // GATING RENDER: Prevent evaluation of route navigation loops during 
  // active auth profile retrieval states or store updates.
  // =========================================================================
  if (IS_PRODUCTION && (isLoading || isProfileResolving)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontFamily: 'sans-serif', 
        color: '#1c1c1e',
        backgroundColor: '#f2f2f7'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Verifying Profile Session...</div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>Establishing connection to node manager</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/login"
          element={
            IS_PRODUCTION ? (
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              user?.sys_admin ? (
                <Navigate to="/sysadmin" replace />
              ) : (
                <Yards />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/yards"
          element={
            isAuthenticated ? (
              user?.sys_admin ? (
                <AllYards />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/nodes"
          element={
            isAuthenticated ? (
              user?.sys_admin ? (
                <AllNodes />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/companies"
          element={
            isAuthenticated ? (
              <AllCompanies />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/company/:id/yards"
          element={isAuthenticated ? <Yards /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/yard/:id/nodes"
          element={isAuthenticated ? <Nodes /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/node/:id"
          element={isAuthenticated ? <NodeDetails /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/sysadmin"
          element={
            isAuthenticated && user?.sys_admin ? (
              <SysAdmin />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;