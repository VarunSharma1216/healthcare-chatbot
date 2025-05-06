import { useState, FormEvent, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography, 
  Paper, 
  Alert, 
  ThemeProvider, 
  createTheme, 
  Container,
  Avatar,
  Divider,
  Grow,
  CircularProgress,
  useMediaQuery,
  CssBaseline
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PersonIcon from '@mui/icons-material/Person';

// Define custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
      light: '#757de8',
      dark: '#002984',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

// Define the Message type
interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

// Define the ChatMessage type for OpenAI
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Check if Supabase is properly configured
  useEffect(() => {
    // Verify if the Supabase URL and key are available
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error("Supabase configuration missing");
      setError("Missing Supabase configuration. For development, you can use the mock response instead.");
    }
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "👋 Hi there! I'm your healthcare scheduling assistant. Tell me about what kind of therapy you're looking for, your schedule preferences, and your insurance provider. I'll help you find the right therapist.",
          timestamp: new Date()
        } as Message
      ]);
    }
  }, []);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // add user message
    const userMessage: Message = { sender: "user", text: input, timestamp: new Date() };
    setMessages((m) => [...m, userMessage]);
    setIsLoading(true);

    try {
      // For development/demo purposes - use mock response if Supabase is not configured
      if (error) {
        // Mock a bot response after a short delay
        setTimeout(() => {
          const mockResponse = `Thanks for sharing that information. Based on your needs for ${input}, I can help match you with a therapist who specializes in this area. 

Could you please also tell me:
1. Do you have any preferred days or times for appointments?
2. What insurance provider do you have, if any?`;
          
          setMessages((m) => [
            ...m,
            { sender: "bot", text: mockResponse, timestamp: new Date() } as Message,
          ]);
          setIsLoading(false);
        }, 1500);
        setInput("");
        return;
      }

      // call your Edge Function
      const { data, error: supabaseError } = await supabase.functions.invoke(
        "handle-chat",
        {
          body: JSON.stringify({ 
            messageText: input,
            conversationHistory: conversationHistory 
          }),
        }
      );

      if (supabaseError) {
        console.error("Function error:", supabaseError);
        setMessages((m) => [
          ...m,
          { sender: "bot", text: "❌ Something went wrong. Please try again later.", timestamp: new Date() } as Message,
        ]);
      } else {
        // Add the bot's response
        setMessages((m) => [
          ...m,
          { sender: "bot", text: data.reply as string, timestamp: new Date() } as Message,
        ]);
        
        // Update conversation history
        if (data.conversationHistory) {
          setConversationHistory(data.conversationHistory);
        }
        
        // Show notification if data was saved to Supabase
        if (data.dataSaved) {
          console.log("✅ Patient information saved to database:", data.savedData);
          
          // Add a system message to indicate the information was saved
          setTimeout(() => {
            setMessages((m) => [
              ...m,
              { 
                sender: "bot", 
                text: "✅ Your information has been saved and we're matching you with therapists. An administrator will contact you shortly with appointment options.", 
                timestamp: new Date() 
              } as Message,
            ]);
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((m) => [
        ...m,
        { sender: "bot", text: "❌ An unexpected error occurred. Please try again.", timestamp: new Date() } as Message,
      ]);
    } finally {
      setIsLoading(false);
    }

    setInput("");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ height: '100%', mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'calc(100vh - 100px)' : '80vh',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          {/* Chat Header */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
          }}>
            <MedicalServicesIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Healthcare Assistant</Typography>
          </Box>
          
          {/* Error Alert */}
          {error && (
            <Alert severity="warning" sx={{ mx: 2, mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Messages Container */}
          <Box
            sx={{
              p: 2,
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: '#f8f9fa',
            }}
          >
            {messages.map((message, index) => (
              <Grow
                key={index}
                in={true}
                timeout={500}
                style={{ transformOrigin: message.sender === 'user' ? 'right' : 'left' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    width: '100%',
                  }}
                >
                  {message.sender === 'bot' && (
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                      <MedicalServicesIcon />
                    </Avatar>
                  )}
                  
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '75%',
                      backgroundColor: message.sender === 'user' ? '#e3f2fd' : 'white',
                      borderRadius: 2,
                      borderTopLeftRadius: message.sender === 'user' ? undefined : 0,
                      borderTopRightRadius: message.sender === 'user' ? 0 : undefined,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    <Typography variant="body1">{message.text}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                  
                  {message.sender === 'user' && (
                    <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                </Box>
              </Grow>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <Box sx={{ display: 'flex', m: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                  <MedicalServicesIcon />
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    borderTopLeftRadius: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <CircularProgress size={20} color="primary" sx={{ mr: 2 }} />
                  <Typography>Thinking...</Typography>
                </Paper>
              </Box>
            )}
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </Box>
          
          <Divider />
          
          {/* Message Input */}
          <Box
            component="form"
            onSubmit={sendMessage}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'white',
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{ 
                mr: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                }
              }}
            />
            <IconButton 
              color="primary" 
              type="submit" 
              disabled={!input.trim() || isLoading}
              size="large"
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}