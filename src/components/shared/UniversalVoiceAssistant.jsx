import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, Keyboard, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VoiceTaskInput from "../tasks/VoiceTaskInput";
import { enqueueCapture } from "@/lib/pendingCaptures";

export default function UniversalVoiceAssistant({ theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('voice');
  const [typedText, setTypedText] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setMode('voice');
      setTypedText("");
      setFeedbackMessage("");
    };
    window.addEventListener('open-voice-assistant', handleOpen);
    return () => window.removeEventListener('open-voice-assistant', handleOpen);
  }, []);

  // Both voice and typed input hand the raw text to the SAME shared capture
  // pipeline Home / Quick Add / Add Task use — one parser everywhere.
  const submitText = (text) => {
    const clean = (text || "").trim();
    if (!clean) return;
    enqueueCapture({ text: clean });
    setFeedbackMessage("✅ Got it — adding your task...");
    setTimeout(() => {
      setIsOpen(false);
      setFeedbackMessage("");
      navigate(createPageUrl("Home"), { state: { reload: true } });
    }, 1000);
  };

  const handleClose = () => {
    window.__microphoneActive = false;
    setIsOpen(false);
    setTypedText("");
    setFeedbackMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              What's on your mind?
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {feedbackMessage || (mode === 'voice' ? "Tap the mic and speak your task" : "Type your task")}
            </p>
          </div>

          {mode === 'voice' ? (
            <div className="space-y-4">
              <VoiceTaskInput
                onTranscription={submitText}
                theme={theme}
                inline={false}
              />
              <Button
                variant="ghost"
                onClick={() => setMode('text')}
                className="w-full flex items-center justify-center gap-2 text-sm"
              >
                <Keyboard className="w-4 h-4" />
                Or type instead
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type what you need to remember..."
                rows={3}
                className={theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : ''}
              />
              <Button
                disabled={!typedText.trim()}
                onClick={() => submitText(typedText)}
                className={`w-full ${
                  theme === 'dark'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : theme === 'minimalist'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                <Send className="w-4 h-4 mr-2" />
                Add It
              </Button>
              <Button
                variant="ghost"
                onClick={() => setMode('voice')}
                className="w-full flex items-center justify-center gap-2 text-sm"
              >
                <Mic className="w-4 h-4" />
                Or use voice
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}