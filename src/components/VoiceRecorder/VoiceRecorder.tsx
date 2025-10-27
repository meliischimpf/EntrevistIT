'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './VoiceRecorder.module.css';
import { getGeminiResponse, speakText, ChatMessage } from '@/services/geminiService';

// Web Speech API types are in src/types/speech-recognition.d.ts

interface VoiceRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  isRecording: boolean;
  onRecordingChange: (isRecording: boolean) => void;
  onStartInterview: (language: string) => void;
}

const PROGRAMMING_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C#',
  'C++',
  'Ruby',
  'Go',
  'Rust',
  'PHP'
];

export default function VoiceRecorder({ 
  onTranscriptUpdate, 
  isRecording, 
  onRecordingChange,
  onStartInterview
}: VoiceRecorderProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isGeminiProcessing, setIsGeminiProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [browserSupport, setBrowserSupport] = useState({
    speechRecognition: false,
    speechSynthesis: false
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Verificar compatibilidad del navegador
    const checkBrowserCompatibility = () => {
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const hasSpeechSynthesis = 'speechSynthesis' in window;
      
      setBrowserSupport({
        speechRecognition: hasSpeechRecognition,
        speechSynthesis: hasSpeechSynthesis
      });
      
      if (!hasSpeechRecognition) {
        console.warn('Tu navegador no soporta la API de reconocimiento de voz. Prueba con Chrome o Edge.');
        setIsSupported(false);
        return false;
      }
      
      if (!hasSpeechSynthesis) {
        console.warn('Tu navegador no soporta la API de síntesis de voz. Las respuestas no se leerán en voz alta.');
      }
      
      setIsSupported(hasSpeechRecognition);
      return hasSpeechRecognition;
    };
    
    const isCompatible = checkBrowserCompatibility();
    if (!isCompatible) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configuración mejorada del reconocimiento
    recognition.continuous = true;
    recognition.interimResults = false; // Solo resultados finales para mayor precisión
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      console.log('Resultado de reconocimiento recibido:', event.results);
      let finalTranscript = '';

      // Solo procesamos resultados finales para mayor precisión
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const current = event.results[i][0].transcript.trim();
          console.log('Transcripción final detectada:', current);
          if (current) {
            finalTranscript += current + ' ';
          }
        }
      }
      
      if (finalTranscript) {
        console.log('Actualizando transcripción:', finalTranscript);
        setTranscript(prev => prev + finalTranscript);
        onTranscriptUpdate(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Error en el reconocimiento de voz:', event.error, 'Tipo de error:', event.type);
      
      // Mapeo de códigos de error a mensajes legibles
      const errorMessages: {[key: string]: string} = {
        'no-speech': 'No se detectó voz. Por favor, habla más fuerte o más cerca del micrófono.',
        'audio-capture': 'No se pudo acceder al micrófono. Asegúrate de que el micrófono esté conectado y los permisos estén habilitados.',
        'not-allowed': 'Permiso para usar el micrófono denegado. Por favor, actualiza los permisos en la configuración de tu navegador.',
        'language-not-supported': 'El idioma español no está soportado en tu navegador.',
        'default': 'Error en el reconocimiento de voz. Por favor, intenta de nuevo.'
      };
      
      const errorMessage = errorMessages[event.error] || errorMessages['default'];
      console.error('Mensaje de error:', errorMessage);
      
      // Mostrar mensaje al usuario
      setTranscript(`Error: ${errorMessage}`);
      
      onRecordingChange(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        // Reiniciar el reconocimiento si se detuvo inesperadamente
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    if (isRecording) {
      try {
        recognition.start();
      } catch (error: unknown) {
        console.error('Error al iniciar el reconocimiento de voz:', error);
        onRecordingChange(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscriptUpdate, isRecording]);

  const handleGeminiResponse = useCallback(async (userInput: string) => {
    console.log('handleGeminiResponse llamado con:', userInput);
    if (!userInput.trim()) {
      console.log('Entrada vacía, ignorando');
      return;
    }
    
    setIsGeminiProcessing(true);
    
    try {
      // Agregar el mensaje del usuario al historial
      const userMessage: ChatMessage = {
        role: 'user',
        parts: userInput,
        timestamp: Date.now()
      };
      
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);
      
      console.log('Llamando a getGeminiResponse...');
      try {
        const { text: response, error } = await getGeminiResponse(
          userInput,
          updatedHistory
        );
        
        if (error) {
          console.error('Error de Gemini:', error);
          return;
        }
        
        console.log('Respuesta de Gemini recibida:', response);
      
      if (response) {
        // Agregar la respuesta al historial
        const botMessage: ChatMessage = {
          role: 'model',
          parts: response,
          timestamp: Date.now()
        };
        
        setChatHistory(prev => [...prev, botMessage]);
        
        // Leer la respuesta en voz alta
        speakText(response);
      }
    } catch (error) {
      console.error('Error al procesar la respuesta de Gemini:', error);
    } finally {
      setIsGeminiProcessing(false);
    }
    } catch (error) {
      console.error('Excepción en handleGeminiResponse:', error);
    } finally {
      console.log('Finalizando handleGeminiResponse');
      setIsGeminiProcessing(false);
    }
  }, [chatHistory]);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      // Primero verificamos si hay dispositivos de entrada disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      if (audioInputs.length === 0) {
        setTranscript('Error: No se encontró ningún micrófono conectado. Por favor, conecta un micrófono e intenta de nuevo.');
        return false;
      }

      // Intentar acceder al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Detener todas las pistas para liberar el micrófono
      stream.getTracks().forEach(track => track.stop());
      return true;
      
    } catch (error: any) {
      console.error('Error al acceder al micrófono:', error);
      
      let errorMessage = 'Error al acceder al micrófono. ';
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No se encontró ningún micrófono conectado.';
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Permiso denegado. Por favor, permite el acceso al micrófono en la configuración de tu navegador.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'No se puede acceder al micrófono. Puede que esté siendo usado por otra aplicación.';
      } else {
        errorMessage += `Error: ${error.message || 'Desconocido'}`;
      }
      
      setTranscript(errorMessage);
      return false;
    }
  }, []);

  const toggleRecording = useCallback(async (): Promise<void> => {
    console.log('toggleRecording llamado, isRecording actual:', isRecording);
    
    // Verificar permisos primero
    if (!isRecording) {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;
    }
    
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.error('El reconocimiento de voz no está disponible');
      return;
    }

    if (isRecording) {
      // Detener la grabación
      console.log('Deteniendo grabación...');
      
      // Guardar la referencia a la función onend original
      const originalOnEnd = recognition.onend;
      
      // Configurar el manejador para cuando se detenga
      recognition.onend = () => {
        console.log('Grabación detenida con éxito');
        onRecordingChange(false);
        
        // Restaurar el manejador original
        recognition.onend = originalOnEnd;
        
        // Procesar la transcripción con Gemini
        if (transcript.trim()) {
          console.log('Transcripción para enviar a Gemini:', transcript);
          handleGeminiResponse(transcript);
        } else {
          console.log('No hay transcripción para enviar');
        }
      };
      
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error al detener la grabación:', error);
        // Forzar la detención si hay un error
        recognition.onend = null;
        onRecordingChange(false);
      }
    } else {
      // Iniciar nueva grabación
      setTranscript('');
      onTranscriptUpdate('');

      try {
        recognition.start();
        onRecordingChange(true);
      } catch (error) {
        console.error('Error al iniciar la grabación:', error);
        onRecordingChange(false);
      }
    }
  }, [isRecording, onRecordingChange, transcript, handleGeminiResponse, onTranscriptUpdate, requestMicrophonePermission]);

  const handleStartInterview = () => {
    if (!selectedLanguage) {
      setTranscript('Por favor selecciona un lenguaje de programación');
      return;
    }
    onStartInterview(selectedLanguage);
    setIsLanguageSelected(true);
  };

  if (!isSupported) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <p>⚠️ Tu navegador no es compatible con la función de reconocimiento de voz.</p>
          <p>Por favor, usa Google Chrome o Microsoft Edge.</p>
        </div>
      </div>
    );
  }

  if (!isLanguageSelected) {
    return (
      <div className={styles.languageSelection}>
        <h3>Selecciona un lenguaje de programación</h3>
        <div className={styles.languageGrid}>
          {PROGRAMMING_LANGUAGES.map((lang) => (
            <button
              key={lang}
              className={`${styles.languageButton} ${
                selectedLanguage === lang ? styles.selected : ''
              }`}
              onClick={() => setSelectedLanguage(lang)}
            >
              {lang}
            </button>
          ))}
        </div>
        <button 
          className={styles.startButton}
          onClick={handleStartInterview}
          disabled={!selectedLanguage}
        >
          Comenzar Entrevista
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.languageBadge}>
        Entrevista de {selectedLanguage}
      </div>
      <button
        onClick={toggleRecording}
        className={`${styles.recordButton} ${
          isRecording ? styles.recording : ''
        } ${isGeminiProcessing ? styles.processing : ''}`}
        disabled={isGeminiProcessing}
      >
        {isGeminiProcessing ? 'Procesando...' : isRecording ? 'Detener' : 'Hablar'}
      </button>
      <div className={styles.transcriptContainer}>
        <div className={styles.transcript}>
          {transcript || (isRecording ? 'Habla ahora...' : 'Presiona el botón para hablar')}
        </div>
      </div>
    </div>
  );
}