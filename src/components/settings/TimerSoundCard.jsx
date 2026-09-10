import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Play } from 'lucide-react';
import { COMPLETION_SOUNDS, LAUNCH_SOUND_KEY, getLaunchAlertSound } from '@/components/utils/completionSounds';
import { stopAlertLoop } from '@/components/utils/alertLoop';

export default function TimerSoundCard({ theme }) {
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
    <Card className={`mb-6 border-none shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
          <Volume2 className="w-5 h-5" />
          Sprint &amp; Launchpad Sound
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          The sound that plays when a 5-minute sprint or a launchpad countdown ends. It repeats
          until you tap something, so it's hard to miss.
        </p>
        <div className="flex gap-2">
          <Select value={sound} onValueChange={handleChange}>
            <SelectTrigger className={`flex-1 ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMPLETION_SOUNDS).map(([key, s]) => (
                <SelectItem key={key} value={key}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={preview} className="flex-shrink-0">
            <Play className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}