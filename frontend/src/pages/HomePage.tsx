import { Container, Typography, Box } from '@mui/material';
import ChatWindow from '../components/chat/ChatWindow';

const HomePage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Healthcare Scheduling Assistant
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Find the right therapist for your needs and schedule an appointment.
        </Typography>
      </Box>
      
      <ChatWindow />
    </Container>
  );
};

export default HomePage; 