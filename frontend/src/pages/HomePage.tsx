import { Container, Typography, Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import ChatWindow from '../components/ChatWindow';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7f0 100%)',
        pt: isMobile ? 2 : 4,
        pb: 6
      }}
    >
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            my: 4, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#2c3e50',
              fontSize: isMobile ? '2rem' : '3rem',
              mb: 2,
              animation: 'fadeIn 1s ease-in'
            }}
          >
            Healthcare Scheduling Assistant
          </Typography>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            paragraph
            sx={{
              maxWidth: '700px',
              mb: 4,
              lineHeight: 1.6
            }}
          >
            Find the right therapist for your needs and schedule an appointment.
            Our AI-powered assistant will help match you with the perfect healthcare professional.
          </Typography>
        </Box>
        
        <ChatWindow />
      </Container>
    </Box>
  );
};

export default HomePage; 