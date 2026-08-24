import React from 'react';
import { 
  Zap, 
  Users, 
  Calculator, 
  FileText, 
  GitPullRequest, 
  DollarSign, 
  Target, 
  Building2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ContractorCompanyProfile } from '../types';

export type ActiveNavTab = 
  | 'crm' 
  | 'takeoff' 
  | 'engineering' 
  | 'proposals' 
  | 'change_orders' 
  | 'invoicing' 
  | 'calibration' 
  | 'settings';

interface NavigationProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  companyProfile: ContractorCompanyProfile;
  onResetData: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  companyProfile,
  onResetData
}) => {
  const navItems: { id: ActiveNavTab; label: string; icon: any }[] = [
    { id: 'crm', label: 'Pipeline & CRM', icon: Users },
    { id: 'takeoff', label: 'Bid Builder & Takeoff', icon: Calculator },
    { id: 'engineering', label: 'NEC & Physics Tools', icon: Zap },
    { id: 'proposals', label: 'Proposals & Client View', icon: FileText },
    { id: 'change_orders', label: 'Field Change Orders', icon: GitPullRequest },
    { id: 'invoicing', label: 'Invoicing & Ledger', icon: DollarSign },
    { id: 'calibration', label: 'Productivity Calibration', icon: Target },
    { id: 'settings', label: 'Company Profile', icon: Building2 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <Zap className="w-6 h-6 fill-slate-950 stroke-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg tracking-tight">
                  Volt<span className="text-amber-400">Estimate</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  NEC 2023
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {companyProfile.legalBusinessName} • Lic #{companyProfile.licenseNumber}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onResetData}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition flex items-center gap-1.5"
              title="Reset state to pristine demo records"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
