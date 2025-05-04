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
  Avatar
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useState } from 'react';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
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
                <MenuItem 
                  component={RouterLink} 
                  to="/admin" 
                  onClick={handleClose}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AdminPanelSettingsIcon fontSize="small" />
                  Admin
                </MenuItem>
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
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 