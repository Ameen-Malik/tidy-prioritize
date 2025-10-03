import { useState, useRef, useCallback } from 'react';

interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

export const useVoiceInput = () => {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    error: null,
  });
  
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition not supported in this browser' 
      }));
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setState(prev => ({ 
        ...prev, 
        transcript,
        isListening: false 
      }));
    };

    recognitionRef.current.onerror = (event: any) => {
      setState(prev => ({ 
        ...prev, 
        error: `Error: ${event.error}`,
        isListening: false 
      }));
    };

    recognitionRef.current.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', error: null }));
  }, []);

  return {
    isListening: state.isListening,
    transcript: state.transcript,
    error: state.error,
    startListening,
    stopListening,
    resetTranscript,
  };
};
