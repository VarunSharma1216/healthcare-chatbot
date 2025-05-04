import { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ChatMessage as ChatMessageType } from '../../types';

const WELCOME_MESSAGE: ChatMessageType = {
  id: 'welcome',
  sender: 'bot',
  text: 'Hello! I\'m your healthcare assistant. I can help you find the right therapist based on your needs and schedule an appointment. Please tell me about what you\'re looking for help with, your insurance provider, and when you\'d prefer to schedule a session.',
  timestamp: new Date()
};

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock response function - would be replaced with actual API call
  const getAssistantResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For now, return a simple acknowledgment
    return `I see you're looking for help with "${userMessage}". Let me find the right therapist for you. Would you mind sharing your insurance provider and preferred schedule?`;
  };

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMessage: ChatMessageType = {
      id: uuidv4(),
      sender: 'user',
      text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Get response from assistant (would be an API call)
      const responseText = await getAssistantResponse(text);
      
      // Add assistant message
      const assistantMessage: ChatMessageType = {
        id: uuidv4(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Add error message
      const errorMessage: ChatMessageType = {
        id: uuidv4(),
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '80vh',
        maxWidth: '800px',
        mx: 'auto',
        mt: 4,
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          p: 2,
          backgroundColor: 'primary.main',
          color: 'white',
        }}
      >
        <Typography variant="h6">Healthcare Assistant</Typography>
      </Box>
      
      <Box
        sx={{
          p: 2,
          flexGrow: 1,
          overflow: 'auto',
        }}
      >
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </Paper>
  );
};

export default ChatWindow; 