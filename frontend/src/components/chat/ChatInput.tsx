import { useState } from 'react';
import { Box, TextField, Button, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type your message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        sx={{ mr: 2 }}
      />
      <IconButton 
        color="primary" 
        type="submit" 
        disabled={disabled || !message.trim()}
        size="large"
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default ChatInput; 