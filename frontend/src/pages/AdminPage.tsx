import { Container, Typography, Box, Paper, Button } from '@mui/material';

const AdminPage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" paragraph>
          This is a simple placeholder for the admin dashboard.
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>Patient Inquiries</Typography>
          <Typography variant="body2" color="text.secondary">
            In the complete version, this section will display a list of patient inquiries.
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Scheduled Appointments</Typography>
          <Typography variant="body2" color="text.secondary">
            In the complete version, this section will display a list of scheduled appointments.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminPage; 