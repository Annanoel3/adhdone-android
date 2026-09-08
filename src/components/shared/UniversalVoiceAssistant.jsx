import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Loader2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Task } from "@/entities/Task";
import { ParkingLotIdea } from "@/entities/ParkingLotIdea";
import { User } from "@/entities/User";
import { enqueueCapture } from "@/lib/pendingCaptures";
import { VoiceRecorder } from 'capacitor-voice-recorder';

export default function UniversalVoiceAssistant({ theme, currentPageName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [typedText, setTypedText] = useState("");
  const navigate = useNavigate();

  // Typed input goes through the exact same command handling as speech, so
  // typing and speaking behave identically.
  const handleTypedSubmit = async () => {
    const text = typedText.trim();
    if (!text) return;
    setTypedText("");
    await processVoiceCommand(text);
  };

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setFeedbackMessage("");
    };

    window.addEventListener('open-voice-assistant', handleOpen);
    return () => window.removeEventListener('open-voice-assistant', handleOpen);
  }, []);

  const startRecording = async () => {
    try {
      const { value: hasPermission } = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission) {
        const { value: granted } = await VoiceRecorder.requestAudioRecordingPermission();
        if (!granted) {
          alert("Microphone permission is required to use voice features.");
          return;
        }
      }
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      window.__microphoneActive = true;
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Could not access microphone");
    }
  };

  const stopRecording = async () => {
    try {
      const result = await VoiceRecorder.stopRecording();
      window.__microphoneActive = false;
      setIsRecording(false);
      const { recordDataBase64, mimeType } = result.value;
      const byteString = atob(recordDataBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const audioBlob = new Blob([ab], { type: mimeType });
      await handleTranscription(audioBlob, mimeType);
    } catch (error) {
      console.error("Stop recording error:", error);
      window.__microphoneActive = false;
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob, mimeType) => {
    setIsProcessing(true);
    setProcessingMessage("Transcribing...");

    try {
      const ext = (mimeType || audioBlob.type || 'audio/aac').includes('webm') ? 'webm' : 'm4a';
      const audioFile = new File([audioBlob], `voice-${Date.now()}.${ext}`, {
        type: mimeType || audioBlob.type
      });

      console.log('🎤 [VOICE ASSISTANT] Uploading audio:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type
      });

      const uploadResult = await base44.integrations.Core.UploadFile({
        file: audioFile
      });

      console.log('✅ [VOICE ASSISTANT] Upload result:', uploadResult);

      if (!uploadResult?.file_url) {
        throw new Error('Failed to upload audio');
      }

      const response = await base44.functions.invoke('transcribeAudio', {
        file_url: uploadResult.file_url
      });

      console.log('✅ [VOICE ASSISTANT] Transcription:', response);

      if (response?.data?.success && response?.data?.transcription) {
        await processVoiceCommand(response.data.transcription);
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setFeedbackMessage("❌ Failed to process voice");
      setIsProcessing(false);
    }
  };

  const processVoiceCommand = async (command) => {
    const lowerCommand = command.toLowerCase();

    // Navigation commands
    if (lowerCommand.includes('go to') || lowerCommand.includes('open') || lowerCommand.includes('show me')) {
      const pages = {
        'home': 'Home',
        'tasks': 'Tasks',
        'task': 'Tasks',
        'focus': 'FocusTimer',
        'timer': 'FocusTimer',
        'support': 'SupportSpace',
        'parking lot': 'ParkingLot',
        'ideas': 'ParkingLot',
        'progress': 'Progress',
        'insights': 'Insights',
        'accountability': 'Accountability',
        'partners': 'Accountability',
        'leaderboard': 'Leaderboard',
        'profile': 'Profile',
        'settings': 'ProfileSettings'
      };

      for (const [keyword, page] of Object.entries(pages)) {
        if (lowerCommand.includes(keyword)) {
          setFeedbackMessage(`✅ Opening ${keyword}...`);
          setIsProcessing(false);
          setTimeout(() => {
            setIsOpen(false);
            navigate(createPageUrl(page));
          }, 1000);
          return;
        }
      }
    }

    // Parking lot idea
    if (lowerCommand.includes('save this idea') ||
        lowerCommand.includes('parking lot') ||
        lowerCommand.includes('remember this')) {

      setIsProcessing(true);
      setProcessingMessage("Saving idea...");

      try {
        const ideaText = command.replace(/save this idea|parking lot|remember this/gi, '').trim();

        await ParkingLotIdea.create({
          idea: ideaText,
          converted_to_task: false
        });

        setFeedbackMessage("✅ Idea saved to parking lot!");
        setIsProcessing(false);

        setTimeout(() => {
          setIsOpen(false);
          navigate(createPageUrl("ParkingLot"));
        }, 1500);

        return;
      } catch (error) {
        console.error("Error saving idea:", error);
        setFeedbackMessage("❌ Failed to save idea");
        setIsProcessing(false);
        return;
      }
    }

    // Everything else is a task — hand the raw transcript to the SAME background
    // pipeline Add Task uses, so voice tasks get identical parsing (location,
    // event type, dates, smart nudges) with no separate prompt of their own.
    enqueueCapture({ text: command });
    setFeedbackMessage("✅ Got it — adding your task...");
    setIsProcessing(false);
    setTimeout(() => {
      setIsOpen(false);
      navigate(createPageUrl("Home"), { state: { reload: true } });
    }, 1200);
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    window.__microphoneActive = false;
    setIsOpen(false);
    setFeedbackMessage("");
    setProcessingMessage("");
    setTypedText("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-md ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isRecording
              ? 'bg-red-500 animate-pulse'
              : isProcessing
                ? 'bg-blue-500'
                : theme === 'minimalist'
                  ? 'bg-purple-600'
                  : theme === 'dark'
                    ? 'bg-purple-600'
                    : 'bg-gradient-to-br from-purple-600 to-pink-600'
          }`}>
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : isRecording ? (
              <Mic className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </div>

          <div className="text-center">
            <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {isProcessing
                ? processingMessage
                : isRecording
                  ? "Listening..."
                  : "Voice Assistant"}
            </h3>
            {feedbackMessage ? (
              <p className={`text-sm whitespace-pre-line ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {feedbackMessage}
              </p>
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {isRecording
                  ? "Tap to stop recording"
                  : "Tap to start speaking"}
              </p>
            )}
          </div>

          {!isProcessing && (
            <Button
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : theme === 'minimalist'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : theme === 'dark'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          )}

          {!isProcessing && !isRecording && (
            <div className="w-full space-y-2">
              <div className="flex items-center gap-3">
                <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>or type it</span>
                <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
              </div>
              <Textarea
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type what you need to remember..."
                rows={2}
                className={theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : ''}
              />
              <Button
                variant="outline"
                disabled={!typedText.trim()}
                onClick={handleTypedSubmit}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Add It
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}