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
          {!selectedLanguage && (
            <div className={styles.languageInfo}>
              <p>Selecciona un lenguaje de programación para comenzar la entrevista.</p>
              <p>El asistente de IA generará preguntas técnicas específicas sobre el lenguaje seleccionado.</p>
            </div>
          )}
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
    <div className="relative min-h-screen">
      <div className="container mx-auto px-4 py-8 h-full">
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900/90 to-blue-800/90 backdrop-blur-sm rounded-2xl shadow-2xl mb-6 overflow-hidden border border-blue-700/30">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-semibold text-blue-100">
                  Entrevista sobre: 
                  <span className="text-blue-200 font-medium">{selectedLanguage}</span>
                </h2>
                <button 
                  className="flex items-center gap-2 bg-blue-700/50 hover:bg-blue-600/70 text-blue-100 px-4 py-2 rounded-lg font-medium transition-all border border-blue-600/50 hover:border-blue-400/50 backdrop-blur-sm hover:text-white"
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
          <div className="flex-1 flex flex-col bg-blue-900/20 rounded-2xl overflow-hidden shadow-xl">
            {currentQuestion && (
              <>
                {/* Main content - Combined Robot and Question */}
                <div className="flex-1 flex flex-col">
                  <div className={styles.robotWithQuestion}>
                    <div className={styles.robotScene}>
                      <SplineScene 
                        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-6 shadow-inner border border-blue-700/30 flex-1 flex flex-col justify-center">
                        <div className="text-lg md:text-xl text-blue-50 leading-relaxed mb-6">
                          {currentQuestion.text}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-blue-700/30">
                          <span className="px-3 py-1 bg-blue-800/50 text-blue-200 text-sm font-medium rounded-full border border-blue-700/50">
                            {currentQuestion.category}
                          </span>
                          <span className="px-3 py-1 bg-amber-900/40 text-amber-200 text-sm font-medium rounded-full border border-amber-800/50">
                            Dificultad: {currentQuestion.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice Recorder */}
                <div className="border-t border-blue-800/30 p-4 bg-blue-900/30 backdrop-blur-sm">
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