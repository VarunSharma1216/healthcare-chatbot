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
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
  Alert
} from '@mui/material';
import { useState, useEffect } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../supabaseClient';

// Define types based on database schema
interface Therapist {
  id: string;
  name: string;
  specialties: string[];
  accepted_insurance: string[];
  google_calendar_id?: string;
  created_at: string;
}

interface Inquiry {
  id: string;
  patient_identifier: string | null;
  problem_description: string;
  requested_schedule: string;
  insurance_info: string;
  extracted_specialty: string | null;
  matched_therapist_id: string | null;
  status: string;
  created_at: string;
  // Join data
  therapist?: Therapist;
}

interface Appointment {
  id: string;
  inquiry_id: string;
  therapist_id: string;
  patient_identifier: string | null;
  start_time: string;
  end_time: string;
  google_calendar_event_id: string | null;
  status: string;
  created_at: string;
  // Join data
  therapist?: Therapist;
  inquiry?: Inquiry;
}

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

interface TherapistFormData {
  name: string;
  specialties: string;
  accepted_insurance: string;
}

const AdminPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    newInquiries: 0,
    scheduledAppointments: 0,
    activeTherapists: 0
  });
  
  // Add therapist dialog state
  const [openTherapistDialog, setOpenTherapistDialog] = useState(false);
  const [therapistFormData, setTherapistFormData] = useState<TherapistFormData>({
    name: '',
    specialties: '',
    accepted_insurance: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch data from Supabase on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch therapists
      const { data: therapistsData, error: therapistsError } = await supabase
        .from('therapists')
        .select('*');
      
      if (therapistsError) throw therapistsError;
      
      // Fetch inquiries with therapist join
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from('inquiries')
        .select(`
          *,
          therapist:matched_therapist_id (
            id,
            name,
            specialties
          )
        `);
      
      if (inquiriesError) throw inquiriesError;
      
      // Fetch appointments with therapist join
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          therapist:therapist_id (
            id,
            name,
            specialties
          ),
          inquiry:inquiry_id (
            id,
            patient_identifier,
            problem_description
          )
        `);
      
      if (appointmentsError) throw appointmentsError;
      
      // Update state with the fetched data
      setTherapists(therapistsData || []);
      setInquiries(inquiriesData || []);
      setAppointments(appointmentsData || []);
      
      // Update counts
      setCounts({
        newInquiries: (inquiriesData || []).filter(inq => inq.status === 'pending').length,
        scheduledAppointments: (appointmentsData || []).length,
        activeTherapists: (therapistsData || []).length
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTherapistDialog = () => {
    setOpenTherapistDialog(true);
  };

  const handleCloseTherapistDialog = () => {
    setOpenTherapistDialog(false);
    setTherapistFormData({
      name: '',
      specialties: '',
      accepted_insurance: ''
    });
  };

  const handleTherapistFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTherapistFormData({
      ...therapistFormData,
      [name]: value
    });
  };

  const handleAddTherapist = async () => {
    try {
      // Parse comma-separated values into arrays
      const specialtiesArray = therapistFormData.specialties
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      const insuranceArray = therapistFormData.accepted_insurance
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      const { data, error } = await supabase
        .from('therapists')
        .insert([
          {
            name: therapistFormData.name,
            specialties: specialtiesArray,
            accepted_insurance: insuranceArray
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Refresh data
      fetchData();
      
      // Close dialog
      handleCloseTherapistDialog();
      
    } catch (err) {
      console.error('Error adding therapist:', err);
      setError('Failed to add therapist. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'matched': return 'info';
      case 'scheduled': 
      case 'confirmed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
                onClick={handleOpenTherapistDialog}
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

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

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
                    <Typography variant="h5" fontWeight="bold">{counts.newInquiries}</Typography>
                    <Typography variant="body2" color="text.secondary">New Inquiries</Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(counts.newInquiries * 10, 100)} 
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
                    <Typography variant="h5" fontWeight="bold">{counts.scheduledAppointments}</Typography>
                    <Typography variant="body2" color="text.secondary">Scheduled Appointments</Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(counts.scheduledAppointments * 10, 100)} 
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
                    <Typography variant="h5" fontWeight="bold">{counts.activeTherapists}</Typography>
                    <Typography variant="body2" color="text.secondary">Active Therapists</Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(counts.activeTherapists * 20, 100)} 
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
                {inquiries.length === 0 ? (
                  <Typography align="center" color="text.secondary">No inquiries found</Typography>
                ) : (
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {inquiries.map((inquiry) => (
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
                            primary={inquiry.patient_identifier || 'Anonymous Patient'}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {inquiry.problem_description}
                                </Typography>
                                <Typography component="span" variant="body2">
                                  {` — Insurance: ${inquiry.insurance_info}`}
                                </Typography>
                                <Typography component="span" variant="body2" display="block">
                                  {`Requested Schedule: ${inquiry.requested_schedule}`}
                                </Typography>
                                <Typography component="span" variant="body2" display="block" color="text.secondary">
                                  {`Created: ${formatDate(inquiry.created_at)}`}
        </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </Box>
                    ))}
                  </List>
                )}
              </TabPanel>
              
              {/* Appointments Tab */}
              <TabPanel value={tabValue} index={1}>
                {appointments.length === 0 ? (
                  <Typography align="center" color="text.secondary">No appointments found</Typography>
                ) : (
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {appointments.map((appointment) => (
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
                            primary={`${appointment.patient_identifier || 'Anonymous Patient'} with ${appointment.therapist?.name || 'Unassigned'}`}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {`${formatDate(appointment.start_time)} at ${formatTime(appointment.start_time)}`}
                                </Typography>
                                <Typography component="span" variant="body2" display="block" color="text.secondary">
                                  {`Duration: ${Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60))} minutes`}
          </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </Box>
                    ))}
                  </List>
                )}
              </TabPanel>
              
              {/* Therapists Tab */}
              <TabPanel value={tabValue} index={2}>
                {therapists.length === 0 ? (
                  <Typography align="center" color="text.secondary">No therapists found</Typography>
                ) : (
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
                                  Accepted Insurance:
          </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                  {therapist.accepted_insurance.map((insurance, idx) => (
                                    <Chip 
                                      key={idx} 
                                      label={insurance} 
                                      size="small" 
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))}
                                </Box>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </Box>
                    ))}
                  </List>
                )}
              </TabPanel>
        </Paper>
          </Box>
      </Box>
    </Container>

      {/* Add Therapist Dialog */}
      <Dialog open={openTherapistDialog} onClose={handleCloseTherapistDialog}>
        <DialogTitle>Add New Therapist</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              name="name"
              label="Therapist Name"
              variant="outlined"
              fullWidth
              value={therapistFormData.name}
              onChange={handleTherapistFormChange}
            />
            <TextField
              name="specialties"
              label="Specialties (comma separated)"
              variant="outlined"
              fullWidth
              value={therapistFormData.specialties}
              onChange={handleTherapistFormChange}
              helperText="E.g. anxiety, depression, trauma"
            />
            <TextField
              name="accepted_insurance"
              label="Accepted Insurance (comma separated)"
              variant="outlined"
              fullWidth
              value={therapistFormData.accepted_insurance}
              onChange={handleTherapistFormChange}
              helperText="E.g. aetna, bluecross, united"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTherapistDialog}>Cancel</Button>
          <Button 
            onClick={handleAddTherapist} 
            variant="contained"
            disabled={!therapistFormData.name || !therapistFormData.specialties || !therapistFormData.accepted_insurance}
          >
            Add Therapist
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage; 