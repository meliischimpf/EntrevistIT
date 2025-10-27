export interface Question {
  id: number;
  text: string;
  category: string;
  difficulty: 'baja' | 'media' | 'alta';
  language?: string;
}

export interface InterviewState {
  currentQuestion: Question | null;
  transcript: string;
  isRecording: boolean;
  feedback: string;
}