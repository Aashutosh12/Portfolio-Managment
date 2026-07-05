import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { FinancialGoal, GoalCategory } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Target, 
  Home, 
  Plane, 
  ShieldCheck, 
  Car, 
  Briefcase, 
  Heart, 
  GraduationCap, 
  Compass
} from 'lucide-react';

export const GoalsTab: React.FC = () => {
  const { data, addGoal, editGoal, deleteGoal } = usePortfolio();

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Other');
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!data) return null;
  const currency = data.settings.currency;

  const totalTargetAmt = data.goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavedAmt = data.goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalGapAmt = Math.max(0, totalTargetAmt - totalSavedAmt);
  const averageProgress = totalTargetAmt > 0 ? (totalSavedAmt / totalTargetAmt) * 100 : 0;

  // Icon mapping based on category
  const getCategoryIcon = (cat: GoalCategory) => {
    switch (cat) {
      case 'House': return <Home className="w-5 h-5 text-indigo-400" />;
      case 'Vacation': return <Plane className="w-5 h-5 text-sky-400" />;
      case 'Emergency Fund': return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'Car': return <Car className="w-5 h-5 text-amber-400" />;
      case 'Retirement': return <Briefcase className="w-5 h-5 text-purple-400" />;
      case 'Wedding': return <Heart className="w-5 h-5 text-rose-400" />;
      case 'Education': return <GraduationCap className="w-5 h-5 text-violet-400" />;
      default: return <Compass className="w-5 h-5 text-slate-450" />;
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGoal({
      name,
      category,
      targetAmount,
      currentAmount,
      targetDate,
      notes
    });
    setIsAddOpen(false);
    resetForm();
  };

  const openEditModal = (g: FinancialGoal) => {
    setSelectedGoal(g);
    setName(g.name);
    setCategory(g.category);
    setTargetAmount(g.targetAmount);
    setCurrentAmount(g.currentAmount);
    setTargetDate(g.targetDate);
    setNotes(g.notes || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    editGoal(selectedGoal.id, {
      name,
      category,
      targetAmount,
      currentAmount,
      targetDate,
      notes
    });
    setIsEditOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCategory('Other');
    setTargetAmount(0);
    setCurrentAmount(0);
    setTargetDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setSelectedGoal(null);
  };

  return (
    <div className="space-y-6">
      {/* KPI Goals Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Savings Target</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalTargetAmt, currency)}</p>
          <span className="text-[9px] text-slate-400">Sum of all milestones</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Accumulated Balance</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(totalSavedAmt, currency)}</p>
          <span className="text-[9px] text-slate-400">Total funded capital</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Consolidated Funding Gap</p>
          <p className="text-xl font-bold text-rose-450 mt-1">{formatCurrency(totalGapAmt, currency)}</p>
          <span className="text-[9px] text-slate-400">Capital remaining to fund</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Average Goal Progress</p>
          <p className="text-xl font-bold text-violet-400 mt-1">{averageProgress.toFixed(1)}%</p>
          <span className="text-[9px] text-slate-400">Milestone execution rate</span>
        </div>
      </div>

      {/* Goals Manager Container */}
      <div className="glass p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              <Target className="w-5 h-5 text-rose-500" /> Milestone & Goal Tracker
            </h2>
            <p className="text-xs text-slate-400">Setup specific wealth targets, track funding, and project maturity timelines.</p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-center"
          >
            <Plus className="w-4 h-4" /> Create Goal
          </button>
        </div>

        {/* Goals Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {data.goals.length > 0 ? (
            data.goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              
              // Days countdown
              const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={goal.id} className="bg-slate-900/50 hover:bg-slate-900 border border-slate-805 rounded-2xl p-5 flex flex-col justify-between group transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                          {getCategoryIcon(goal.category)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{goal.name}</h4>
                          <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wide">{goal.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(goal)}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete milestone goal ${goal.name}?`)) {
                              deleteGoal(goal.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block">TARGET</span>
                        <span className="font-bold text-slate-200 font-mono text-sm">{formatCurrency(goal.targetAmount, currency)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block">SAVED</span>
                        <span className="font-bold text-emerald-400 font-mono text-sm">{formatCurrency(goal.currentAmount, currency)}</span>
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-violet-600 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono">{progress.toFixed(1)}% funded</span>
                        <span className="text-slate-400 font-mono">
                          {remaining > 0 ? `${formatCurrency(remaining, currency)} left` : 'Fully funded!'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/40 mt-4 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      Target Date: {formatDate(goal.targetDate)}
                    </span>
                    <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${daysLeft <= 0 ? 'bg-emerald-950/60 text-emerald-400' : 'bg-slate-850 text-slate-350'}`}>
                      {daysLeft <= 0 ? 'Completed' : `${daysLeft} days to go`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center text-slate-500 py-10">
              No financial goals configured. Click 'Create Goal' to track targets.
            </div>
          )}
        </div>
      </div>

      {/* --- ADD GOAL MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configure Financial Goal</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-400">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Downpayment for House"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Goal Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GoalCategory)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="House">House / Real Estate</option>
                  <option value="Vacation">Vacation / Travel</option>
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Car">Car / Vehicle</option>
                  <option value="Retirement">Retirement (FIRE)</option>
                  <option value="Wedding">Wedding / Family Event</option>
                  <option value="Education">Education / Upskilling</option>
                  <option value="Other">Other Milestone</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Target Amount</label>
                  <input
                    type="number"
                    value={targetAmount || ''}
                    onChange={(e) => setTargetAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Currently Saved</label>
                  <input
                    type="number"
                    value={currentAmount || ''}
                    onChange={(e) => setCurrentAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Add Notes</label>
                <textarea
                  placeholder="Linked accounts, savings plans, auto-transfer setups..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-5 rounded-xl"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT GOAL MODAL --- */}
      {isEditOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modify Goal ({selectedGoal.name})</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-400">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Goal Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GoalCategory)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="House">House / Real Estate</option>
                  <option value="Vacation">Vacation / Travel</option>
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Car">Car / Vehicle</option>
                  <option value="Retirement">Retirement (FIRE)</option>
                  <option value="Wedding">Wedding / Family Event</option>
                  <option value="Education">Education / Upskilling</option>
                  <option value="Other">Other Milestone</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Target Amount</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Currently Saved</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Add Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-5 rounded-xl"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
