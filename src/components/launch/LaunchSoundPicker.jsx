import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Play } from 'lucide-react';
import { COMPLETION_SOUNDS, LAUNCH_SOUND_KEY, getLaunchAlertSound } from '@/components/utils/completionSounds';
import { stopAlertLoop } from '@/components/utils/alertLoop';

// Compact end-of-timer sound chooser, shown right where the user starts a
// Launchpad or Sprint so they can set it in the moment.
export default function LaunchSoundPicker({ theme }) {
  const [sound, setSound] = useState(getLaunchAlertSound);

  const handleChange = (value) => {
    setSound(value);
    localStorage.setItem(LAUNCH_SOUND_KEY, value);
  };

  const preview = () => {
    stopAlertLoop();
    const a = new Audio(COMPLETION_SOUNDS[sound].url);
    a.play().catch(() => {});
  };

  return (
    <div className={`pt-3 mt-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <p className={`text-xs font-medium mb-2 flex items-center gap-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        <Volume2 className="w-3.5 h-3.5" />
        End-of-timer sound
      </p>
      <div className="flex gap-2">
        <Select value={sound} onValueChange={handleChange}>
          <SelectTrigger className={`flex-1 h-9 text-sm ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(COMPLETION_SOUNDS).map(([key, s]) => (
              <SelectItem key={key} value={key}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={preview} className="flex-shrink-0 h-9 w-9">
          <Play className="w-4 h-4" />
        </Button>
      </div>
      <p className={`text-[11px] mt-1.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
        Repeats until you tap something, so it's hard to miss.
      </p>
    </div>
  );
}