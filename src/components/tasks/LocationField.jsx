import React, { useState, useEffect } from 'react';
import { MapPin, Pencil, Navigation } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocationSuggestions from "./LocationSuggestions";

// Where this task/event actually happens. Editable pill — the AI never guesses
// a location, so this is the only way a user can add one after capture (and the
// errand-combining nudges only fire on tasks that have one).
// Edits inline (no nested popover) — a popover layered inside the task dialog
// swallowed taps on Android, so Save never fired.
export default function LocationField({ task, theme, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(task.location || '');

  useEffect(() => { setValue(task.location || ''); }, [task.id, task.location]);

  const save = (v) => {
    onSave(v.trim() ? v.trim() : null);
    setEditing(false);
  };

  // Opens the device's default map app on mobile, Google Maps on the web.
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location || '')}`;

  if (editing) {
    return (
      <div className={`w-full space-y-2 p-3 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200'
      }`}>
        <label className={`text-sm font-medium block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Location:</label>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Address, business name, or city"
          onKeyDown={(e) => { if (e.key === 'Enter') save(value); }}
          autoFocus
        />
        <LocationSuggestions query={value} theme={theme} onPick={(s) => save(s)} />
        <div className="flex gap-2">
          <Button type="button" onClick={() => save(value)} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
            Save Location
          </Button>
          <Button type="button" variant="outline" onClick={() => { setValue(task.location || ''); setEditing(false); }}>
            Cancel
          </Button>
        </div>
        {task.location && (
          <button
            type="button"
            onClick={() => { setValue(''); save(''); }}
            className="w-full text-center px-3 py-2 text-sm hover:bg-red-50 rounded text-red-600 font-medium"
          >
            Remove location
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 max-w-full min-w-0">
      {task.location && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Maps"
          className={`cursor-pointer hover:opacity-80 transition-opacity px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 min-w-0 ${
            theme === 'dark' ? 'bg-teal-900 text-teal-300' : 'bg-teal-100 text-teal-700'
          }`}
        >
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{task.location}</span>
          <Navigation className="w-3 h-3 flex-shrink-0 opacity-60" />
        </a>
      )}
      {task.location ? (
        <button
          type="button"
          title="Edit location"
          onClick={() => setEditing(true)}
          className={`cursor-pointer hover:opacity-80 transition-opacity p-1 rounded-full flex-shrink-0 ${
            theme === 'dark' ? 'text-teal-400 hover:bg-teal-900' : 'text-teal-600 hover:bg-teal-100'
          }`}
        >
          <Pencil className="w-3 h-3" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="cursor-pointer hover:opacity-80 transition-opacity border border-dashed border-gray-300 px-3 py-1 rounded-full text-sm font-medium text-gray-500 bg-white flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" />
          Add Location
        </button>
      )}
    </div>
  );
}