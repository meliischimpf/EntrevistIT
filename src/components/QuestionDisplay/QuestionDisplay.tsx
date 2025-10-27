import React from 'react';
import styles from './QuestionDisplay.module.css';

type Difficulty = 'baja' | 'media' | 'alta' | '';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  baja: 'Fácil',
  media: 'Intermedio',
  alta: 'Difícil',
  '': 'Sin dificultad'
} as const;

interface QuestionDisplayProps {
  question: string;
  category: string;
  difficulty: Difficulty;
  onNext: () => void;
  transcript: string;
  isRecording: boolean;
  className?: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  category,
  difficulty = '',
  onNext,
  transcript,
  isRecording,
  className = ''
}) => {
  const handleNextClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onNext();
  };

  if (!question) {
    return (
      <div className={`${styles.questionContainer} ${className}`}>
        <div className={styles.questionCard}>
          <p>No hay más preguntas disponibles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.questionContainer} ${className}`}>
      <div className={styles.questionCard}>
        <div className={styles.questionMeta}>
          {difficulty && (
            <span 
              className={`${styles.difficulty} ${styles[difficulty]}`}
              data-testid="difficulty-badge"
            >
              {DIFFICULTY_LABELS[difficulty]}
            </span>
          )}
          {category && (
            <span className={styles.category} data-testid="category-badge">
              {category}
            </span>
          )}
        </div>
        
        <h3 className={styles.questionText} data-testid="question-text">
          {question}
        </h3>
        
        <div className={styles.answerSection}>
          <h4>Tu respuesta:</h4>
          <div 
            className={`${styles.transcript} ${isRecording ? styles.recording : ''}`}
            data-testid="transcript"
          >
            {transcript || (isRecording ? 'Escuchando...' : 'Tu respuesta aparecerá aquí')}
          </div>
        </div>

        <button 
          onClick={handleNextClick}
          className={styles.nextButton}
          data-testid="next-button"
        >
          Siguiente Pregunta
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path 
              d="M5 12H19M19 12L12 5M19 12L12 19" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default React.memo(QuestionDisplay);