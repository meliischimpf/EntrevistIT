import { GoogleGenerativeAI } from '@google/generative-ai';

type HarmCategory = 
  | 'HARM_CATEGORY_HARASSMENT'
  | 'HARM_CATEGORY_HATE_SPEECH'
  | 'HARM_CATEGORY_SEXUALLY_EXPLICIT'
  | 'HARM_CATEGORY_DANGEROUS_CONTENT';

type HarmBlockThreshold = 
  | 'BLOCK_NONE'
  | 'BLOCK_ONLY_HIGH'
  | 'BLOCK_MEDIUM_AND_ABOVE'
  | 'BLOCK_LOW_AND_ABOVE';

// Configuración de Gemini
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// Verificar si la clave de API está configurada
if (!GEMINI_API_KEY) {
  console.warn('No se encontró la clave de API de Gemini. Asegúrate de configurar NEXT_PUBLIC_GEMINI_API_KEY en tus variables de entorno.');
}

/**
 * Obtiene una respuesta de Gemini basada en el prompt proporcionado
 * @param prompt El mensaje del usuario
 * @param history Historial de la conversación (opcional)
 * @returns Respuesta de Gemini
 */
export const getGeminiResponse = async (
  prompt: string,
  history: ChatMessage[] = []
): Promise<{ text: string; error?: string }> => {
  if (!GEMINI_API_KEY) {
    return {
      text: '',
      error: 'No se ha configurado la API Key de Gemini. Por favor, configura NEXT_PUBLIC_GEMINI_API_KEY en tus variables de entorno.'
    };
  }

  try {
    // Preparar el historial de la conversación
    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.parts }]
      })),
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT' as const,
            threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH' as const,
            threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as const,
            threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as const,
            threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from Gemini API:', errorData);
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      throw new Error('No se pudo obtener una respuesta del modelo');
    }
    
    return { text };
  } catch (error) {
    console.error('Error al obtener respuesta de Gemini:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Ocurrió un error al procesar tu solicitud.'
    };
  }
};

interface GenerateQuestionOptions {
  language: string;
  previousQuestions?: string[];
  difficulty?: 'baja' | 'media' | 'alta';
  topic?: string;
}

/**
 * Genera una pregunta de entrevista para un lenguaje de programación específico
 * @param options Opciones para generar la pregunta
 * @returns La pregunta generada como string
 */
export const generateQuestion = async (options: GenerateQuestionOptions): Promise<string> => {
  const { language, previousQuestions = [], difficulty = 'media', topic } = options;
  
  const difficultyPrompt = {
    baja: 'básica',
    media: 'intermedia',
    alta: 'avanzada'
  }[difficulty];
  
  const topicPrompt = topic ? `sobre ${topic} ` : '';
  const previousQuestionsPrompt = previousQuestions.length > 0 
    ? `\n\nPreguntas anteriores para no repetir:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` 
    : '';
  
  const prompt = `Genera una pregunta de entrevista técnica de nivel ${difficultyPrompt} ${topicPrompt}sobre ${language}.${previousQuestionsPrompt}\n\nLa pregunta debe ser clara, concisa y evaluar conocimientos prácticos.`;
  
  const result = await getGeminiResponse(prompt);
  
  // Si hay un error, lanzar una excepción
  if (result.error) {
    throw new Error(result.error);
  }
  
  // Limpiar la respuesta y asegurar que termine con signo de interrogación
  let question = result.text.trim();
  if (!/[?¿]$/.test(question)) {
    question = question.replace(/[.,;]$/, '') + '?';
  }
  
  return question;
};

/**
 * Convierte texto a voz usando la API de síntesis de voz del navegador
 * @param text Texto a convertir a voz
 * @param lang Idioma para la síntesis de voz (por defecto: 'es-ES')
 */
export const speakText = (text: string, lang = 'es-ES'): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('La síntesis de voz no es compatible con este navegador');
    return;
  }

  // Cancelar cualquier síntesis en curso
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  // Obtener voces disponibles y seleccionar una en el idioma deseado
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(lang)) || null;
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
};

// Tipos para el historial de chat
export type ChatMessage = {
  role: 'user' | 'model';
  parts: string;
  timestamp?: number;
};
