import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Mail, Loader2, Check } from 'lucide-react';

// Consent step before anything from a Support Space conversation is emailed to
// the developer. Nothing is sent unless the user taps Send.
export default function SupportEscalationCard({ message, transcript, theme, onDismiss }) {
  const [status, setStatus] = useState('idle');

  const handleSend = async () => {
    setStatus('sending');
    try {
      await base44.functions.invoke('sendSupportRequest', { message, transcript });
      setStatus('sent');
    } catch (e) {
      console.error('Failed to send support request:', e);
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className={`p-4 rounded-lg mr-12 flex items-start gap-2 ${
        theme === 'dark' ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-800'
      }`}>
        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">Sent to customer support. They'll follow up by email.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg mr-12 space-y-3 ${
      theme === 'dark' ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'
    }`}>
      <div className="flex items-start gap-2">
        <Mail className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
        <div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-100' : 'text-blue-900'}`}>
            Would you like to send this to customer support?
          </p>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
            Your message, this conversation, and your name and email would be emailed to the developer. Nothing is sent unless you tap Send.
          </p>
        </div>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-500">Couldn't send that — please try again.</p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSend} disabled={status === 'sending'} className="bg-blue-600 hover:bg-blue-700 text-white">
          {status === 'sending' ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending…</> : 'Send to support'}
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss} disabled={status === 'sending'}>
          No thanks
        </Button>
      </div>
    </div>
  );
}