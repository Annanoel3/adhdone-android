import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Live address / business-name suggestions under the Location input.
export default function LocationSuggestions({ query, theme, onPick }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = (query || '').trim();
    if (q.length < 2) { setItems([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await base44.functions.invoke('placesAutocomplete', { input: q });
      if (!cancelled) setItems(res?.data?.suggestions || []);
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  if (items.length === 0) return null;

  return (
    <ul className={`rounded-lg border overflow-hidden ${
      theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
    }`}>
      {items.map((s) => (
        <li key={s}>
          <button
            type="button"
            onClick={() => onPick(s)}
            className={`w-full text-left px-3 py-2 text-sm flex items-start gap-2 ${
              theme === 'dark' ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-teal-50 text-gray-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-teal-600" />
            <span>{s}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}