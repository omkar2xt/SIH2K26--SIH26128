import React from 'react';
import { Play } from 'lucide-react';

export default function DemoTag() {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
      <Play size={10} fill="currentColor" /> Demo Mode
    </div>
  );
}