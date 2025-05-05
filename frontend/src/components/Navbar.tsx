import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  useTheme, 
  useMediaQuery, 
  Menu, 
  MenuItem, 
  Container,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, login, logout, error: authError, clearError } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLoginOpen = () => {
    setLoginOpen(true);
    handleClose();
  };

  const handleLoginClose = () => {
    setLoginOpen(false);
    setError(null);
    setEmail('');
    setPassword('');
  };

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearError();
    setIsLoading(true);

    try {
      await login(email, password);
      handleLoginClose();
      navigate('/admin');
    } catch (err) {
      // Error is handled by the auth context and set to state
      console.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleClose();
  };

  return (
    <>
      <AppBar 
        position="static"
        elevation={0}
        sx={{ 
          background: 'linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Avatar 
              variant="rounded"
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                mr: 1,
                bgcolor: 'white',
                color: 'primary.main',
                borderRadius: 2
              }}
            >
              <MedicalServicesIcon />
            </Avatar>
            
            <Typography 
              variant="h6" 
              component={RouterLink}
              to="/"
              sx={{ 
                flexGrow: 1, 
                textDecoration: 'none',
                color: 'white',
                fontWeight: 700,
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Healthcare Scheduler
            </Typography>
            
            {isMobile ? (
              <Box>
                <IconButton
                  size="large"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMenu}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem 
                    component={RouterLink} 
                    to="/" 
                    onClick={handleClose}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <HomeIcon fontSize="small" />
                    Home
                  </MenuItem>
                  
                  {isAuthenticated ? (
                    <>
                      <MenuItem 
                        component={RouterLink} 
                        to="/admin" 
                        onClick={handleClose}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <AdminPanelSettingsIcon fontSize="small" />
                        Admin
                      </MenuItem>
                      <MenuItem 
                        onClick={handleLogout}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LogoutIcon fontSize="small" />
                        Logout
                      </MenuItem>
                    </>
                  ) : (
                    <MenuItem 
                      onClick={handleLoginOpen}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <LoginIcon fontSize="small" />
                      Admin Login
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/"
                  startIcon={<HomeIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Home
                </Button>
                
                {isAuthenticated ? (
                  <>
                    <Button 
                      color="inherit" 
                      component={RouterLink} 
                      to="/admin"
                      startIcon={<AdminPanelSettingsIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Admin
                    </Button>
                    <Button 
                      color="inherit"
                      onClick={handleLogout}
                      startIcon={<LogoutIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button 
                    color="inherit"
                    onClick={handleLoginOpen}
                    startIcon={<LoginIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Admin Login
                  </Button>
                )}
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Login Dialog */}
      <Dialog 
        open={loginOpen} 
        onClose={handleLoginClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: '100%',
            maxWidth: 400
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            pb: 2
          }}
        >
          Admin Login
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              id="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Please contact your administrator for login credentials.
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={handleLoginClose}
              color="primary"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              disabled={isLoading || !email || !password}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Navbar; 