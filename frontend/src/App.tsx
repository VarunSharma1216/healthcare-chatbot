import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import { Box, CircularProgress } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { useContext, ReactNode, useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { supabase } from './supabaseClient';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, session, user } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log('ProtectedRoute - Auth State:', { isAuthenticated, session: !!session, user: !!user });
  
  useEffect(() => {
    // Only check admin status if user is authenticated
    if (!isAuthenticated || !session) {
      console.log('ProtectedRoute - Not authenticated or no session');
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    const checkAdminStatus = async () => {
      try {
        console.log('ProtectedRoute - Checking admin status');
        // For development testing, temporarily skip the actual admin check
        // Comment this section out when Supabase is fully configured
        console.log('ProtectedRoute - DEVELOPMENT MODE: Setting isAdmin=true');
        setIsAdmin(true);
        setLoading(false);
        return;
        
        // Call the Edge Function to verify admin status
        const { data, error } = await supabase.functions.invoke('check-admin', {
          headers: {
            Authorization: `Bearer ${session?.access_token || ''}`
          }
        });
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          console.log('ProtectedRoute - Admin status response:', data);
          setIsAdmin(data.isAdmin);
        }
      } catch (err) {
        console.error('Failed to verify admin status:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [isAuthenticated, session]);
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated || isAdmin === false) {
    // Redirect to home if not authenticated or not admin
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1, py: 2 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;