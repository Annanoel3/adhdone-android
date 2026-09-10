import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SEEN_KEY = 'home_zip_prompt_seen';

// One-time, skippable ask for a home zip code. Only asked the first time the
// user creates something that actually leaves the house (an errand / a task
// with a location) — that's the moment the zip is useful, so the ask makes
// sense instead of arriving out of nowhere on launch.
export default function HomeZipPrompt({ user, theme }) {
  const [open, setOpen] = useState(false);
  const [zip, setZip] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Saved on the profile too, so a new device / cleared browser storage
    // doesn't start asking all over again.
    if (localStorage.getItem(SEEN_KEY) === 'true' || user.home_zip_prompt_seen) return;
    if (user.home_zipcode) {
      localStorage.setItem(SEEN_KEY, 'true');
      return;
    }
    const onErrand = () => setOpen(true);
    window.addEventListener('errand-task-created', onErrand);
    return () => window.removeEventListener('errand-task-created', onErrand);
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, 'true');
    setOpen(false);
    base44.auth.updateMe({ home_zip_prompt_seen: true }).catch(() => {});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ home_zipcode: zip.trim() });
    } catch (e) {
      console.error('Failed to save home zip code:', e);
    } finally {
      setSaving(false);
      dismiss();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className={`max-w-md w-[calc(100vw-2rem)] ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
            <MapPin className="w-5 h-5" />
            Where's home base?
          </DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
            Drop in your zip code and I can start grouping errands that are near each other
            into one trip instead of three. Just a zip — no GPS, no tracking.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="e.g. 78701"
          inputMode="numeric"
          className={theme === 'dark' ? 'bg-gray-800 text-gray-100 border-gray-700' : ''}
        />

        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Totally optional — you can add or change it any time in <strong>Settings → Home Zip Code</strong>.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={dismiss} disabled={saving}>
            Not now
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !zip.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}