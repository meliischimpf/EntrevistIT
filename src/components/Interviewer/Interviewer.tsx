// src/components/Interviewer/Interviewer.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './Interviewer.module.css';
import VoiceRecorder from '../VoiceRecorder/VoiceRecorder';
import QuestionDisplay from '../QuestionDisplay/QuestionDisplay';
import { Question } from '../../types/interview';
import { generateQuestion } from '../../services/geminiService';
import { SplineScene } from '../ui/splite'; // Add SplineScene import

// Web Speech API types are now in src/types/speech-recognition.d.ts

const questions: Question[] = [
  {
    id: 1,
    text: "Háblame sobre tu experiencia con React y TypeScript",
    category: "Técnica",
    difficulty: "media"
  },
  // Más preguntas...
];

export default function Interviewer() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNewQuestion = useCallback(async (language: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const questionText = await generateQuestion({
        language,
        previousQuestions: currentQuestion ? [currentQuestion.text] : []
      });
      
      // Generate a unique ID for the new question
      const newQuestion: Question = {
        id: Date.now(), // Using timestamp as a simple unique ID
        text: questionText,
        category: language,
        difficulty: ['baja', 'media', 'alta'][Math.floor(Math.random() * 3)] as 'baja' | 'media' | 'alta',
        language
      };
      
      setCurrentQuestion(newQuestion);
      setTranscript('');
      return newQuestion;
    } catch (err) {
      console.error('Error generating question:', err);
      setError('Error al generar la pregunta. Por favor, inténtalo de nuevo.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestion]);

  const handleStartInterview = async (language: string) => {
    setSelectedLanguage(language);
    setInterviewStarted(true);
    await generateNewQuestion(language);
  };

  const handleNextQuestion = useCallback(async () => {
    if (selectedLanguage) {
      try {
        await generateNewQuestion(selectedLanguage);
      } catch (error) {
        console.error('Error in handleNextQuestion:', error);
      }
    }
  }, [selectedLanguage, generateNewQuestion]);

  const handleTranscriptUpdate = (newTranscript: string) => {
    setTranscript(prev => prev + ' ' + newTranscript);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.interviewContainer}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Generando pregunta sobre {selectedLanguage}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.interviewContainer}>
          <div className={styles.errorState}>
            <p>{error}</p>
            <button 
              onClick={() => handleNextQuestion()}
              className={styles.retryButton}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className={styles.container}>
        <div className={styles.interviewContainer}>
          <h1 className={styles.title}>Simulador de Entrevista Técnica</h1>
          <p className={styles.subtitle}>
            Prepárate para una entrevista técnica con reconocimiento de voz. 
            Responde a las preguntas hablando y practica tus habilidades de comunicación.
          </p>
          <div className={styles.languageInfo}>
            <p>Selecciona un lenguaje de programación para comenzar la entrevista.</p>
            <p>El asistente de IA generará preguntas técnicas específicas sobre el lenguaje seleccionado.</p>
          </div>
          <VoiceRecorder
            onTranscriptUpdate={handleTranscriptUpdate}
            isRecording={isRecording}
            onRecordingChange={setIsRecording}
            onStartInterview={handleStartInterview}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 h-full">
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg mb-4">
            <div className="bg-blue-600 text-white p-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Entrevista sobre: 
                  <span className="text-blue-100"> {selectedLanguage}</span>
                </h2>
                <button 
                  className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  onClick={handleNextQuestion}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generando...' : 'Siguiente Pregunta'}
                  {!isLoading && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className={styles.interviewContainer}>
            {currentQuestion && (
              <>
                {/* Header */}
                <div className={styles.interviewHeader}>
                  <div className={styles.languageBadge}>
                    Preguntando sobre {selectedLanguage}
                  </div>
                </div>
                
                {/* Main content - Combined Robot and Question */}
                <div className={styles.combinedContainer}>
                  <div className={styles.robotWithQuestion}>
                    <div className={styles.robotScene}>
                      <SplineScene 
                        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                        className="w-full h-full"
                      />
                    </div>
                    <div className={styles.robotQuestionCard}>
                      <div className={styles.questionContent}>
                        <div className={styles.questionText}>
                          {currentQuestion.text}
                        </div>
                        <div className={styles.questionMeta}>
                          <span className={styles.questionCategory}>{currentQuestion.category}</span>
                          <span className={styles.questionDifficulty}>{currentQuestion.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice Recorder */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {error && (
                    <div className="p-4 text-red-600 bg-red-50 rounded-lg mb-4">
                      {error}
                    </div>
                  )}
                  <VoiceRecorder
                    onTranscriptUpdate={handleTranscriptUpdate}
                    isRecording={isRecording}
                    onRecordingChange={setIsRecording}
                    onStartInterview={() => {}}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}