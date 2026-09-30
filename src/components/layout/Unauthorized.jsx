import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function Unauthorized({ onGoBack, onGoHome }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={40} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">ACCESS RESTRICTED</h2>
      <p className="text-slate-600 mb-8 max-w-md">
        You do not have permission to access this resource. Your current role does not grant you the necessary authorization.
      </p>
      <div className="flex items-center gap-4">
        {onGoBack && (
          <button 
            onClick={onGoBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        )}
        <button 
          onClick={onGoHome}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-800 text-white font-semibold hover:bg-teal-900 transition-colors"
        >
          <Home size={18} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
