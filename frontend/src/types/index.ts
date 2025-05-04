export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface Therapist {
  id: string;
  name: string;
  specialties: string[];
  acceptedInsurance: string[];
}

export interface AppointmentTime {
  date: string;
  startTime: string;
  endTime: string;
} 