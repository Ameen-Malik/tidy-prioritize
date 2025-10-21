import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, MicOff, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface VoiceAssistantProps {
  onTaskCreated: () => void;
}

export const VoiceAssistant = ({ onTaskCreated }: VoiceAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Memoize handlers to prevent unnecessary re-renders
  // Define before useEffect so it can be used in speech recognition setup
  const handleUserMessage = useCallback(async (content: string) => {
    setIsListening(false);
    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-task-assistant', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) throw error;

      setMessages(prev => [...prev, data.message]);

      if (data.task_created) {
        onTaskCreated();
        toast({
          title: "Task Created",
          description: "Your task has been added successfully!",
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [messages, onTaskCreated, toast]);

  // Setup speech recognition with memoized handlers
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        await handleUserMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [handleUserMessage, toast]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const handleSendText = useCallback(() => {
    if (textInput.trim()) {
      handleUserMessage(textInput);
      setTextInput("");
    }
  }, [textInput, handleUserMessage]);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full h-14 w-14 shadow-lg"
      >
        <Mic className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Voice Task Assistant</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-[300px]">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Hi! I'm your task assistant.</p>
                <p className="text-sm mt-2">Tell me what task you'd like to add.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}-${msg.content.substring(0, 20)}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center pt-4 border-t">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Type a message..."
              disabled={isProcessing}
            />
            <Button
              onClick={handleSendText}
              disabled={isProcessing || !textInput.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              variant={isListening ? "destructive" : "secondary"}
              size="icon"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
