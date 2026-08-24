import React, { useState } from 'react';
import { ContractorCompanyProfile } from '../types';
import { Building2, ShieldCheck, CheckCircle2, DollarSign, FileText, UserCheck, Save } from 'lucide-react';

interface CompanyProfileViewProps {
  companyProfile: ContractorCompanyProfile;
  onSaveProfile: (profile: ContractorCompanyProfile) => void;
}

export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({
  companyProfile,
  onSaveProfile
}) => {
  const [profile, setProfile] = useState<ContractorCompanyProfile>(companyProfile);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Electrical Contractor Profile & Credentials</h2>
          </div>
          <p className="text-xs text-slate-400">
            Official license credentials, insurance coverage, payment milestones, and legal proposal disclosures.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile credentials saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Business Identity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Business Identity & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Legal Entity Business Name</label>
              <input
                type="text"
                value={profile.legalBusinessName}
                onChange={(e) => setProfile({ ...profile, legalBusinessName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">DBA / Trade Brand Name</label>
              <input
                type="text"
                value={profile.dbaName || ''}
                onChange={(e) => setProfile({ ...profile, dbaName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Headquarters Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* License & Insurance Credentials */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            License & Insurance Mandates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Master Electrician License #</label>
              <input
                type="text"
                value={profile.licenseNumber}
                onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">License Type / Classification</label>
              <input
                type="text"
                value={profile.licenseType}
                onChange={(e) => setProfile({ ...profile, licenseType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Jurisdiction / AHJ State</label>
              <input
                type="text"
                value={profile.issuingAuthorityState}
                onChange={(e) => setProfile({ ...profile, issuingAuthorityState: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Authorized Licensed Reviewer</label>
              <input
                type="text"
                value={profile.authorizedLicensedWorkReviewer}
                onChange={(e) => setProfile({ ...profile, authorizedLicensedWorkReviewer: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">General Liability Policy Limit</label>
              <input
                type="text"
                value={profile.generalLiabilityPolicyLimit || '$2,000,000 Aggregate / $1,000,000 Occurrence'}
                onChange={(e) => setProfile({ ...profile, generalLiabilityPolicyLimit: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Milestone Billing Percentages & Contract Disclosures */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Default Milestone Schedule & Terms
          </h3>

          <div className="grid grid-cols-3 gap-4 font-mono">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-sans">Deposit %</label>
              <input
                type="number"
                value={profile.defaultPaymentSchedule.depositPercent}
                onChange={(e) => setProfile({
                  ...profile,
                  defaultPaymentSchedule: { ...profile.defaultPaymentSchedule, depositPercent: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-center"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-sans">Rough-In %</label>
              <input
                type="number"
                value={profile.defaultPaymentSchedule.roughInPercent}
                onChange={(e) => setProfile({
                  ...profile,
                  defaultPaymentSchedule: { ...profile.defaultPaymentSchedule, roughInPercent: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-center"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-sans">Final %</label>
              <input
                type="number"
                value={profile.defaultPaymentSchedule.finalPercent}
                onChange={(e) => setProfile({
                  ...profile,
                  defaultPaymentSchedule: { ...profile.defaultPaymentSchedule, finalPercent: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-center"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Default Standard Proposal Contract Terms</label>
            <textarea
              value={profile.defaultTermsAndConditions}
              onChange={(e) => setProfile({ ...profile, defaultTermsAndConditions: e.target.value })}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Company Credentials
          </button>
        </div>
      </form>
    </div>
  );
};
