import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Divider, 
  Card, 
  CardContent, 
  CardHeader, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip,
  LinearProgress,
  Tab,
  Tabs
} from '@mui/material';
import { useState } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AddIcon from '@mui/icons-material/Add';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for the prototype
  const recentInquiries = [
    { id: 1, patient: 'Sarah Johnson', issue: 'Anxiety and stress management', insurance: 'Blue Cross', status: 'pending' },
    { id: 2, patient: 'Michael Chen', issue: 'Depression', insurance: 'Aetna', status: 'matched' },
    { id: 3, patient: 'Emily Rodriguez', issue: 'Family counseling', insurance: 'United', status: 'scheduled' },
    { id: 4, patient: 'David Kim', issue: 'Grief counseling', insurance: 'Kaiser', status: 'pending' },
  ];

  const upcomingAppointments = [
    { id: 1, patient: 'Michael Chen', therapist: 'Dr. Amanda Wilson', date: '2023-06-15', time: '10:00 AM', status: 'confirmed' },
    { id: 2, patient: 'Emily Rodriguez', therapist: 'Dr. James Taylor', date: '2023-06-16', time: '2:30 PM', status: 'confirmed' },
    { id: 3, patient: 'Lisa Park', therapist: 'Dr. Amanda Wilson', date: '2023-06-17', time: '11:15 AM', status: 'pending' },
  ];

  const therapists = [
    { id: 1, name: 'Dr. Amanda Wilson', specialties: ['Anxiety', 'Depression', 'PTSD'], patients: 12 },
    { id: 2, name: 'Dr. James Taylor', specialties: ['Family Therapy', 'Couples Counseling'], patients: 8 },
    { id: 3, name: 'Dr. Maria Gonzalez', specialties: ['Addiction', 'Trauma', 'Grief'], patients: 10 },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'matched': return 'info';
      case 'scheduled': return 'success';
      case 'confirmed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7f0 100%)',
        pt: 3,
        pb: 6
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header Section */}
          <Box>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 2,
                background: 'linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)',
                color: 'white',
                display: 'flex',
                flexDirection: {xs: 'column', sm: 'row'},
                alignItems: {xs: 'flex-start', sm: 'center'},
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                  Admin Dashboard
                </Typography>
                <Typography variant="body1">
                  Manage patient inquiries, appointments, and therapist assignments
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                sx={{ 
                  mt: {xs: 2, sm: 0},
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: '#e0e0e0' }
                }}
              >
                Add Therapist
              </Button>
            </Paper>
          </Box>

          {/* Statistics Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3
          }}>
            <Card raised sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">12</Typography>
                    <Typography variant="body2" color="text.secondary">New Inquiries</Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={65} 
                  sx={{ mt: 2, height: 8, borderRadius: 5 }} 
                />
              </CardContent>
            </Card>
            
            <Card raised sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <EventIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">8</Typography>
                    <Typography variant="body2" color="text.secondary">Scheduled Appointments</Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={40} 
                  sx={{ mt: 2, height: 8, borderRadius: 5, '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' } }} 
                />
              </CardContent>
            </Card>
            
            <Card raised sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                    <MedicalServicesIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">5</Typography>
                    <Typography variant="body2" color="text.secondary">Active Therapists</Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ mt: 2, height: 8, borderRadius: 5, '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} 
                />
              </CardContent>
            </Card>
          </Box>

          {/* Main Content Tabs */}
          <Box>
            <Paper sx={{ width: '100%', borderRadius: 2, mt: 2 }} elevation={0}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="admin dashboard tabs"
                  sx={{ '& .MuiTab-root': { fontWeight: 600 } }}
                >
                  <Tab label="Patient Inquiries" />
                  <Tab label="Appointments" />
                  <Tab label="Therapists" />
                </Tabs>
              </Box>
              
              {/* Inquiries Tab */}
              <TabPanel value={tabValue} index={0}>
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {recentInquiries.map((inquiry) => (
                    <Box key={inquiry.id}>
                      <ListItem 
                        alignItems="flex-start"
                        secondaryAction={
                          <Chip 
                            label={inquiry.status} 
                            color={getStatusColor(inquiry.status)}
                            size="small"
                          />
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={inquiry.patient}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {inquiry.issue}
                              </Typography>
                              {` — Insurance: ${inquiry.insurance}`}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </Box>
                  ))}
                </List>
              </TabPanel>
              
              {/* Appointments Tab */}
              <TabPanel value={tabValue} index={1}>
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {upcomingAppointments.map((appointment) => (
                    <Box key={appointment.id}>
                      <ListItem 
                        alignItems="flex-start"
                        secondaryAction={
                          <Chip 
                            label={appointment.status} 
                            color={getStatusColor(appointment.status)}
                            size="small"
                          />
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.light' }}>
                            <AccessTimeIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${appointment.patient} with ${appointment.therapist}`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {appointment.date} at {appointment.time}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </Box>
                  ))}
                </List>
              </TabPanel>
              
              {/* Therapists Tab */}
              <TabPanel value={tabValue} index={2}>
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {therapists.map((therapist) => (
                    <Box key={therapist.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#4caf50' }}>
                            <MedicalServicesIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={therapist.name}
                          secondary={
                            <>
                              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                {therapist.specialties.map((specialty, idx) => (
                                  <Chip 
                                    key={idx} 
                                    label={specialty} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                Active patients: {therapist.patients}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </Box>
                  ))}
                </List>
              </TabPanel>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminPage; 