import React from 'react';
import { History, Calendar } from 'lucide-react';

export const ScanHistory: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Historical Scans</h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit trail of previous daily session scans, classification movements, and constituent composition snapshots.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#121824] border border-[#232E47] text-xs text-slate-400">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>Historical Archive</span>
        </div>
      </div>

      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Historical Archive Standing By</h3>
          <p className="text-sm text-slate-400">
            PostgreSQL persistence for daily scan results and constituent changes will be activated in Level 7.
          </p>
        </div>
      </div>
    </div>
  );
};
