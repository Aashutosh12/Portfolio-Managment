import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { CurrencyType } from '../../types';
import { 
  Settings, 
  Shield, 
  Key, 
  Trash2, 
  Upload, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle,
  Copy,
  Download
} from 'lucide-react';
import { hasMasterPasswordSet } from '../../services/storage';

export const SettingsTab: React.FC = () => {
  const { 
    data, 
    updateSettings, 
    enableEncryption, 
    disableEncryption, 
    importBackupData,
    exportBackupData,
    resetDatabase 
  } = usePortfolio();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Backup export state
  const [exportedPayload, setExportedPayload] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [showExportCopySuccess, setShowExportCopySuccess] = useState(false);

  // Backup restore state
  const [backupText, setBackupText] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [backupError, setBackupError] = useState('');

  // Wipe confirm
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  if (!data) return null;

  const hasPassword = hasMasterPasswordSet();

  // Setup Master Password
  const handleSetupPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      enableEncryption(password);
      setAuthSuccess('Local database has been securely encrypted with AES-256!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setAuthError('Failed to encrypt database. Please try again.');
    }
  };

  // Disable Encryption
  const handleDisablePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      disableEncryption(password);
      setAuthSuccess('AES-256 Encryption disabled. Data is stored in local plaintext.');
      setPassword('');
    } catch (err) {
      setAuthError('Incorrect master password. Could not decrypt database.');
    }
  };

  // Process backup restore
  const handleRestoreBackup = (e: React.FormEvent) => {
    e.preventDefault();
    setBackupError('');
    try {
      importBackupData(backupText, backupPassword || undefined);
      alert('Portfolio restored successfully!');
      window.location.reload();
    } catch (err: any) {
      setBackupError(err.message || 'Failed to import backup.');
    }
  };

  const handleGenerateBackup = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = exportBackupData(exportPassword || undefined);
      setExportedPayload(payload);
    } catch (err) {
      alert('Failed to generate backup payload.');
    }
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportedPayload);
    setShowExportCopySuccess(true);
    setTimeout(() => setShowExportCopySuccess(false), 2000);
  };

  const handleDownloadBackupFile = () => {
    const blob = new Blob([exportedPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `portfolio_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Factory reset database
  const handleFactoryReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (wipeConfirmText === 'WIPE DATA') {
      if (confirm('Are you absolutely sure? This will wipe all stocks, cryptos, savings, loans, and passwords forever. There is no undo.')) {
        resetDatabase();
      }
    } else {
      alert('Please enter "WIPE DATA" to confirm.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Settings className="w-5 h-5 text-slate-400" /> System Settings
        </h2>
        <p className="text-xs text-slate-400">Configure localization, refresh intervals, auto-lock timeouts, and database encryption.</p>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel 1: Core Preferences */}
        <div className="glass p-6 rounded-3xl border border-slate-805 space-y-5">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
            General Preferences
          </h3>

          <div className="space-y-4 text-xs">
            {/* Currency Choice */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-200">Base Currency</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Primary currency displays across modules</p>
              </div>
              <select
                value={data.settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value as CurrencyType })}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 py-1.5 px-3 rounded-lg focus:outline-none focus:border-violet-500 font-bold font-mono"
              >
                <option value="INR">INR (₹) Indian Rupee</option>
                <option value="USD">USD ($) US Dollar</option>
                <option value="EUR">EUR (€) Euro</option>
              </select>
            </div>

            {/* Inactivity Auto Lock */}
            <div className="flex items-center justify-between border-t border-slate-800/40 pt-4">
              <div>
                <h4 className="font-bold text-slate-200">Session Auto-Lock Timeout</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Locks dashboard automatically after inactivity</p>
              </div>
              <select
                value={data.settings.lockTimeout}
                onChange={(e) => updateSettings({ lockTimeout: parseInt(e.target.value, 10) })}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 py-1.5 px-3 rounded-lg focus:outline-none focus:border-violet-500 font-bold"
              >
                <option value={0}>Disabled (Always unlocked)</option>
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>

            {/* Live Pricing Refresh Interval */}
            <div className="flex items-center justify-between border-t border-slate-800/40 pt-4">
              <div>
                <h4 className="font-bold text-slate-200">Live API Refresh Interval</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Frequency of background Binance price checks</p>
              </div>
              <select
                value={data.settings.refreshInterval}
                onChange={(e) => updateSettings({ refreshInterval: parseInt(e.target.value, 10) })}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 py-1.5 px-3 rounded-lg focus:outline-none focus:border-violet-500 font-bold font-mono"
              >
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
                <option value={300}>5 Minutes</option>
                <option value={600}>10 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Panel 2: Secure Database Encryption */}
        <div className="glass p-6 rounded-3xl border border-slate-805 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-violet-400" /> Database Vault Protection
          </h3>

          {authError && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-200 text-xs">{authError}</div>
          )}
          {authSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {authSuccess}
            </div>
          )}

          {hasPassword ? (
            /* Disable Form */
            <form onSubmit={handleDisablePassword} className="space-y-4 text-xs font-semibold">
              <div className="p-3 bg-violet-950/20 border border-violet-850 rounded-xl leading-relaxed text-slate-350">
                Your database is encrypted with <strong className="text-white">AES-256</strong>. To turn off protection and save plain JSON, input your password below.
              </div>

              <div className="space-y-1">
                <label className="text-slate-450">Master Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 pl-9 text-white font-mono"
                    required
                  />
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-950 hover:bg-red-900/60 border border-red-550/30 text-red-250 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
              >
                Disable Master Password (Decrypt)
              </button>
            </form>
          ) : (
            /* Enable Form */
            <form onSubmit={handleSetupPassword} className="space-y-4 text-xs font-semibold">
              <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl leading-relaxed text-slate-350">
                Setup a master password to encrypt your entire portfolio state inside your browser storage. If locked, no data can be accessed without this password.
              </div>

              <div className="space-y-1">
                <label className="text-slate-450">Choose Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-450">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Retype password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 text-white py-2.5 rounded-xl font-bold transition-all shadow-md"
              >
                Enable AES-256 Vault Encryption
              </button>
            </form>
          )}
        </div>

        {/* Panel 3: Export Backup */}
        <div className="glass p-6 rounded-3xl border border-slate-805 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
            Export / Download Portfolio Backup
          </h3>

          <form onSubmit={handleGenerateBackup} className="space-y-4 text-xs font-semibold">
            {hasPassword && (
              <div className="space-y-1">
                <label className="text-slate-450">Encryption Password</label>
                <input
                  type="password"
                  placeholder="Enter password to encrypt this backup file"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-805 rounded-lg p-2 text-white font-mono"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold py-2.5 rounded-xl hover:bg-indigo-600/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <Key className="w-4 h-4" /> Generate Secure Backup Payload
            </button>
          </form>

          {exportedPayload && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-slate-450">Your Backup JSON Payload (Encrypted/Plain)</label>
                <textarea
                  readOnly
                  value={exportedPayload}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-350 font-mono h-24 text-[10px] select-all cursor-pointer"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all text-xs"
                >
                  {showExportCopySuccess ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {showExportCopySuccess ? 'Copied!' : 'Copy to Clipboard'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBackupFile}
                  className="flex-1 bg-violet-600 hover:bg-violet-550 text-white py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download .JSON File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel 4: JSON Backups */}
        <div className="glass p-6 rounded-3xl border border-slate-805 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
            Import / Restore Portfolio Backup
          </h3>

          {backupError && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-200 text-xs">{backupError}</div>
          )}

          <form onSubmit={handleRestoreBackup} className="space-y-4 text-xs font-semibold">
            <div className="space-y-1">
              <label className="text-slate-450">Paste Backup JSON string</label>
              <textarea
                placeholder='Paste raw backup payload starting with {"settings": ...} or encrypted hash...'
                value={backupText}
                onChange={(e) => setBackupText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono h-24 text-[10px]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-450">Decryption password (If backup was encrypted)</label>
              <input
                type="password"
                placeholder="Leave blank if plain JSON"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-805 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-violet-600/20 text-violet-300 border border-violet-500/30 font-bold py-2.5 rounded-xl hover:bg-violet-600/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Validate & Restore Database
            </button>
          </form>
        </div>

        {/* Panel 4: Factory Reset (Destructive) */}
        <div className="glass p-6 rounded-3xl border border-red-900/35 space-y-4 bg-red-950/5">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider border-b border-red-900/30 pb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>

          <div className="text-xs text-red-300 leading-relaxed space-y-2">
            <p>
              Wiping your database will destroy all stocks, cryptos, savings logs, and master passwords. 
              <strong> This cannot be reversed.</strong> Ensure you have exported a copy of your backup text first.
            </p>
          </div>

          <form onSubmit={handleFactoryReset} className="space-y-4 text-xs font-semibold">
            <div className="space-y-1">
              <label className="text-red-400">Type "WIPE DATA" to authorize</label>
              <input
                type="text"
                placeholder="Type confirmation here"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                className="w-full bg-red-950/20 border border-red-900/40 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-650 hover:bg-red-550 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-red-950/50"
            >
              <Trash2 className="w-4 h-4 inline mr-1" /> Factory Reset Database
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
