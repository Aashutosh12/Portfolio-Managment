import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { SalaryRecord } from '../../types';
import { formatCurrency, formatPercent, formatCompactCurrency } from '../../utils/formatters';
import { 
  calculateOutstandingLoan 
} from '../../utils/calculations';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Briefcase, 
  PiggyBank
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

export const SalaryTab: React.FC = () => {
  const { data, addSalary, editSalary, deleteSalary } = usePortfolio();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [monthlyExpenseEstimate, setMonthlyExpenseEstimate] = useState<number>(60000); // customizable

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);

  // Form States
  const [employer, setEmployer] = useState('');
  const [expectedSalary, setExpectedSalary] = useState<number | ''>(0);
  const [receivedSalary, setReceivedSalary] = useState<number | ''>(0);
  const [creditDate, setCreditDate] = useState(new Date().toISOString().split('T')[0]);
  const [bonuses, setBonuses] = useState<number | ''>(0);
  const [incrementPercent, setIncrementPercent] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  // Categorized Budget Form States
  const [rentAndUtilities, setRentAndUtilities] = useState<number | ''>(0);
  const [foodAndGroceries, setFoodAndGroceries] = useState<number | ''>(0);
  const [travelAndLeisure, setTravelAndLeisure] = useState<number | ''>(0);
  const [medicalAndInsurance, setMedicalAndInsurance] = useState<number | ''>(0);
  const [miscellaneous, setMiscellaneous] = useState<number | ''>(0);
  const [monthlyInvestments, setMonthlyInvestments] = useState<number | ''>(0);

  if (!data) return null;
  const currency = data.settings.currency;

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filtering records for the active year
  const yearRecords = data.salary
    .filter(r => r.year === selectedYear)
    .sort((a, b) => a.month - b.month);

  // Core calculations
  const totalBasicSalary = yearRecords.reduce((sum, r) => sum + r.receivedSalary, 0);
  const totalBonuses = yearRecords.reduce((sum, r) => sum + r.bonuses, 0);
  const totalYearlyIncome = totalBasicSalary + totalBonuses;

  // EMI costs for budget calculations
  const totalEMI = data.loans.reduce((sum, loan) => {
    const calc = calculateOutstandingLoan(loan.principalAmount, loan.interestRate, loan.tenureMonths, loan.startMonth);
    return sum + (calc.monthsRemaining > 0 ? loan.emiAmount : 0);
  }, 0);

  // Dynamic Savings / Investment Rates
  // Average monthly salary in active records
  const activeMonthsCount = yearRecords.length || 1;
  const avgMonthlyIncome = totalYearlyIncome / activeMonthsCount;
  
  // Total actual monthly expenses for the active year records
  const totalActualExpenses = yearRecords.reduce((sum, r) => sum + (r.totalExpenses !== undefined ? r.totalExpenses : monthlyExpenseEstimate), 0);
  const avgMonthlyExpense = yearRecords.length > 0 ? (totalActualExpenses / yearRecords.length) : monthlyExpenseEstimate;

  // Savings Rate = (Income - Expense - EMI) / Income
  const monthlySavingsAmt = Math.max(0, avgMonthlyIncome - avgMonthlyExpense - totalEMI);
  const savingsRate = avgMonthlyIncome > 0 ? (monthlySavingsAmt / avgMonthlyIncome) : 0;

  // Actual Investment Rate = total investments logged / total income
  const totalActualInvestments = yearRecords.reduce((sum, r) => sum + (r.monthlyInvestments || 0), 0);
  const avgMonthlyInvestment = yearRecords.length > 0 ? (totalActualInvestments / yearRecords.length) : 0;
  
  const investmentRate = avgMonthlyIncome > 0 ? (avgMonthlyInvestment / avgMonthlyIncome) : 0.28; // fallback to 28% baseline

  // Chart Data: Monthly Salary credit curve
  const monthlySalaryData = yearRecords.map(r => ({
    name: MONTH_NAMES[r.month].substring(0, 3),
    Salary: r.receivedSalary,
    Bonus: r.bonuses,
    Total: r.receivedSalary + r.bonuses
  }));

  // Chart Data: Income vs Expense vs Investment
  const budgetDistributionData = yearRecords.map(r => {
    const income = r.receivedSalary + r.bonuses;
    const emi = totalEMI;
    const expense = r.totalExpenses !== undefined ? r.totalExpenses : monthlyExpenseEstimate;
    const invest = r.monthlyInvestments !== undefined ? r.monthlyInvestments : Math.round(income * 0.28);

    return {
      name: MONTH_NAMES[r.month].substring(0, 3),
      Income: income,
      Expenses: expense,
      EMI: emi,
      Investments: invest,
    };
  });

  // Dynamic 50/30/20 Budgeting Rule Analysis Metrics
  const netSalaryReceived = yearRecords.reduce((sum, r) => sum + r.receivedSalary + r.bonuses, 0);
  const totalRent = yearRecords.reduce((sum, r) => sum + (r.rentAndUtilities || 0), 0);
  const totalFood = yearRecords.reduce((sum, r) => sum + (r.foodAndGroceries || 0), 0);
  const totalTravel = yearRecords.reduce((sum, r) => sum + (r.travelAndLeisure || 0), 0);
  const totalMedical = yearRecords.reduce((sum, r) => sum + (r.medicalAndInsurance || 0), 0);
  const totalMisc = yearRecords.reduce((sum, r) => sum + (r.miscellaneous || 0), 0);
  const totalActualEMI = totalEMI * yearRecords.length;

  const totalNeeds = totalRent + totalFood + totalMedical + totalActualEMI;
  const totalWants = totalTravel + totalMisc;

  const needsRate = netSalaryReceived > 0 ? (totalNeeds / netSalaryReceived) : 0;
  const wantsRate = netSalaryReceived > 0 ? (totalWants / netSalaryReceived) : 0;
  const savingsInvestRate = netSalaryReceived > 0 ? ((netSalaryReceived - totalNeeds - totalWants) / netSalaryReceived) : 0;

  const categoryData = [
    { name: 'Rent & Utilities', value: totalRent, color: '#8b5cf6' },
    { name: 'Food & Groceries', value: totalFood, color: '#f59e0b' },
    { name: 'Travel & Leisure', value: totalTravel, color: '#3b82f6' },
    { name: 'Medical & Insurance', value: totalMedical, color: '#ef4444' },
    { name: 'Miscellaneous', value: totalMisc, color: '#10b981' },
  ].filter(c => c.value > 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(creditDate);
    
    const rent = Number(rentAndUtilities) || 0;
    const food = Number(foodAndGroceries) || 0;
    const travel = Number(travelAndLeisure) || 0;
    const medical = Number(medicalAndInsurance) || 0;
    const misc = Number(miscellaneous) || 0;
    const totalExp = rent + food + travel + medical + misc;
    
    addSalary({
      year: dateObj.getFullYear(),
      month: dateObj.getMonth(),
      employer,
      expectedSalary: Number(expectedSalary) || 0,
      receivedSalary: Number(receivedSalary) || 0,
      creditDate,
      bonuses: Number(bonuses) || 0,
      incrementPercent: Number(incrementPercent) || 0,
      notes,
      rentAndUtilities: rent,
      foodAndGroceries: food,
      travelAndLeisure: travel,
      medicalAndInsurance: medical,
      miscellaneous: misc,
      totalExpenses: totalExp,
      monthlyInvestments: Number(monthlyInvestments) || 0
    });
    setIsAddOpen(false);
    resetForm();
  };

  const openEditModal = (r: SalaryRecord) => {
    setSelectedRecord(r);
    setEmployer(r.employer);
    setExpectedSalary(r.expectedSalary);
    setReceivedSalary(r.receivedSalary);
    setCreditDate(r.creditDate);
    setBonuses(r.bonuses);
    setIncrementPercent(r.incrementPercent);
    setNotes(r.notes || '');
    setRentAndUtilities(r.rentAndUtilities ?? 0);
    setFoodAndGroceries(r.foodAndGroceries ?? 0);
    setTravelAndLeisure(r.travelAndLeisure ?? 0);
    setMedicalAndInsurance(r.medicalAndInsurance ?? 0);
    setMiscellaneous(r.miscellaneous ?? 0);
    setMonthlyInvestments(r.monthlyInvestments ?? 0);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    const dateObj = new Date(creditDate);
    
    const rent = Number(rentAndUtilities) || 0;
    const food = Number(foodAndGroceries) || 0;
    const travel = Number(travelAndLeisure) || 0;
    const medical = Number(medicalAndInsurance) || 0;
    const misc = Number(miscellaneous) || 0;
    const totalExp = rent + food + travel + medical + misc;

    editSalary(selectedRecord.id, {
      year: dateObj.getFullYear(),
      month: dateObj.getMonth(),
      employer,
      expectedSalary: Number(expectedSalary) || 0,
      receivedSalary: Number(receivedSalary) || 0,
      creditDate,
      bonuses: Number(bonuses) || 0,
      incrementPercent: Number(incrementPercent) || 0,
      notes,
      rentAndUtilities: rent,
      foodAndGroceries: food,
      travelAndLeisure: travel,
      medicalAndInsurance: medical,
      miscellaneous: misc,
      totalExpenses: totalExp,
      monthlyInvestments: Number(monthlyInvestments) || 0
    });
    setIsEditOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEmployer('');
    setExpectedSalary(0);
    setReceivedSalary(0);
    setCreditDate(new Date().toISOString().split('T')[0]);
    setBonuses(0);
    setIncrementPercent(0);
    setNotes('');
    setRentAndUtilities(0);
    setFoodAndGroceries(0);
    setTravelAndLeisure(0);
    setMedicalAndInsurance(0);
    setMiscellaneous(0);
    setMonthlyInvestments(0);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* KPI Salary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Yearly Gross Income ({selectedYear})</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalYearlyIncome, currency)}</p>
          <span className="text-[9px] text-slate-400">Salary + Performance Bonuses</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Employer</p>
          <p className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-1.5">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            {yearRecords[yearRecords.length - 1]?.employer || 'Google LLC'}
          </p>
          <span className="text-[9px] text-slate-400">Current primary income source</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Savings Rate</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatPercent(savingsRate)}</p>
          <span className="text-[9px] text-slate-400">Estimated remaining cash flow</span>
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Target Investment Rate</p>
          <p className="text-xl font-bold text-violet-400 mt-1">{formatPercent(investmentRate)}</p>
          <span className="text-[9px] text-slate-400">Equities & compounding products</span>
        </div>
      </div>

      {/* Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Credit area chart */}
        <div className="glass p-5 rounded-3xl border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Salary Credit Trend ({selectedYear})</h3>
          <div className="h-60 w-full text-xs">
            {monthlySalaryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySalaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salaryColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => formatCompactCurrency(v, currency).replace(/[₹$€]/, '')} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} formatter={(val: any) => [formatCurrency(val, currency), '']} />
                  <Area type="monotone" dataKey="Total" stroke="#8b5cf6" strokeWidth={2} fill="url(#salaryColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No salary history recorded for {selectedYear}.</div>
            )}
          </div>
        </div>

        {/* Budget distribution bar chart */}
        <div className="glass p-5 rounded-3xl border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Income vs Expenses vs Investments</h3>
          <div className="h-60 w-full text-xs">
            {budgetDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => formatCompactCurrency(v, currency).replace(/[₹$€]/, '')} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} formatter={(val: any) => [formatCurrency(val, currency), '']} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Income" fill="#6d28d9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Investments" fill="#047857" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No budget data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* 2nd Chart Row: Expense Breakdown */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart of Expense Breakdown */}
          <div className="lg:col-span-2 glass p-5 rounded-3xl border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 mb-3">Categorized Expense Distribution ({selectedYear})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-60 items-center">
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} formatter={(val: any) => [formatCurrency(val, currency), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-xs">
                {categoryData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-850">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-350 font-semibold">{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{formatCurrency(c.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Budgeting Health / Rule card */}
          <div className="glass p-5 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-md">
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-1">50/30/20 Budgeting Rule Analysis</h3>
              <p className="text-[10px] text-slate-400">Financial expert allocation review</p>
            </div>
            
            <div className="space-y-3.5 my-3 text-[11px]">
              {/* Needs (50% target) */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Essential Needs (Target: 50%)</span>
                  <span className="font-bold text-slate-100">{formatPercent(needsRate)}</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div className="bg-violet-500 h-full rounded-full" style={{ width: `${Math.min(100, needsRate * 100)}%` }} />
                </div>
              </div>

              {/* Wants (30% target) */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Wants & Discretionary (Target: 30%)</span>
                  <span className="font-bold text-slate-100">{formatPercent(wantsRate)}</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, wantsRate * 100)}%` }} />
                </div>
              </div>

              {/* Savings/Investments (20% target) */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-350">Savings & Investments (Target: 20%+)</span>
                  <span className="font-bold text-slate-100">{formatPercent(savingsInvestRate)}</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, savingsInvestRate * 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 leading-normal p-2.5 rounded-xl bg-slate-900/30 border border-slate-805/40">
              {savingsInvestRate >= 0.20 
                ? "🟢 Excellent! You are meeting the expert target by saving/investing 20% or more of your income." 
                : "⚠️ Your savings/investment rate is below the recommended 20% target. Try to reduce discretionary 'Wants' spending."}
            </div>
          </div>
        </div>
      )}

      {/* Salary Records Manager */}
      <div className="glass p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-350">Income Ledger</h2>
            <p className="text-xs text-slate-400">Private, local log of employers and monthly cash flow credits.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 py-1.5 px-3 rounded-lg focus:outline-none focus:border-violet-500 font-bold"
            >
              <option value={2026}>Year 2026</option>
              <option value={2025}>Year 2025</option>
              <option value={2024}>Year 2024</option>
            </select>
            
            <button
              onClick={() => {
                resetForm();
                setIsAddOpen(true);
              }}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Log Salary
            </button>
          </div>
        </div>

        {/* Dynamic Budget configuration panel */}
        <div className="my-5 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-violet-400" />
            <div>
              <h4 className="text-xs font-bold text-slate-300">
                {yearRecords.length > 0 ? "Logged Monthly Expenses" : "Set Baseline Expenses"}
              </h4>
              <p className="text-[10px] text-slate-400">
                {yearRecords.length > 0 ? "Auto-calculated average" : "Custom fallback baseline estimate"}
              </p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-3">
            {yearRecords.length > 0 ? (
              <span className="text-xs font-semibold text-emerald-400">
                🟢 Auto-locked to actual logged monthly average: <strong className="font-mono text-white text-sm ml-1">{formatCurrency(avgMonthlyExpense, currency)}</strong>
              </span>
            ) : (
              <>
                <input
                  type="range"
                  min={10000}
                  max={250000}
                  step={5000}
                  value={monthlyExpenseEstimate}
                  onChange={(e) => setMonthlyExpenseEstimate(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <span className="font-mono text-xs font-bold text-white whitespace-nowrap min-w-[80px]">
                  {formatCurrency(monthlyExpenseEstimate, currency)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Salary Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-900/40">
                <th className="py-3 px-4">Employer</th>
                <th className="py-3 px-3">Credit Month</th>
                <th className="py-3 px-3 text-right">Expected Pay</th>
                <th className="py-3 px-3 text-right">Received Pay</th>
                <th className="py-3 px-3 text-right">Performance Bonus</th>
                <th className="py-3 px-3 text-right">Increment Record</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {yearRecords.length > 0 ? (
                yearRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/60 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-white">{r.employer}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-300">
                      {MONTH_NAMES[r.month]} {r.year}
                      <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Credited: {r.creditDate}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-450">{formatCurrency(r.expectedSalary, currency)}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-white">{formatCurrency(r.receivedSalary, currency)}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-violet-400 font-bold">
                      {r.bonuses > 0 ? `+${formatCurrency(r.bonuses, currency)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-bold">
                      {r.incrementPercent > 0 ? `+${r.incrementPercent}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Edit Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove salary credit entry for ${MONTH_NAMES[r.month]}?`)) {
                              deleteSalary(r.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No logged salary credits for {selectedYear}. Click 'Log Salary' to add records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD SALARY MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Salary Credit</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-slate-400">Employer Company</label>
                <input
                  type="text"
                  placeholder="e.g. Google LLC"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Expected Base Salary</label>
                  <input
                    type="number"
                    value={expectedSalary || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10) || 0;
                      setExpectedSalary(v);
                      setReceivedSalary(v); // set default
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Received Base Salary</label>
                  <input
                    type="number"
                    value={receivedSalary || ''}
                    onChange={(e) => setReceivedSalary(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Credit Date</label>
                  <input
                    type="date"
                    value={creditDate}
                    onChange={(e) => setCreditDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Increment % (If any)</label>
                  <input
                    type="number"
                    step="any"
                    value={incrementPercent || ''}
                    onChange={(e) => setIncrementPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Bonuses Received</label>
                <input
                  type="number"
                  value={bonuses || ''}
                  onChange={(e) => setBonuses(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Notes / Pay Stub Details</label>
                <textarea
                  placeholder="Additional deductions, stock vesting credits, tax withholdings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>

              {/* --- EXPERT BUDGETING SECTION --- */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <h4 className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Dynamic Monthly Expenditure</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Rent & Utilities</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={rentAndUtilities || ''}
                      onChange={(e) => setRentAndUtilities(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Food & Groceries</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={foodAndGroceries || ''}
                      onChange={(e) => setFoodAndGroceries(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Travel & Leisure</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={travelAndLeisure || ''}
                      onChange={(e) => setTravelAndLeisure(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Medical & Insurance</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={medicalAndInsurance || ''}
                      onChange={(e) => setMedicalAndInsurance(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Miscellaneous</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={miscellaneous || ''}
                      onChange={(e) => setMiscellaneous(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Actual Investments</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={monthlyInvestments || ''}
                      onChange={(e) => setMonthlyInvestments(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
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
                  Save Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT SALARY MODAL --- */}
      {isEditOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modify Salary Record</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Employer Company</label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Expected Salary</label>
                  <input
                    type="number"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Received Salary</label>
                  <input
                    type="number"
                    value={receivedSalary}
                    onChange={(e) => setReceivedSalary(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Credit Date</label>
                  <input
                    type="date"
                    value={creditDate}
                    onChange={(e) => setCreditDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Increment %</label>
                  <input
                    type="number"
                    step="any"
                    value={incrementPercent}
                    onChange={(e) => setIncrementPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Bonuses</label>
                <input
                  type="number"
                  value={bonuses}
                  onChange={(e) => setBonuses(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>

              {/* --- EXPERT BUDGETING SECTION --- */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <h4 className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Dynamic Monthly Expenditure</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Rent & Utilities</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={rentAndUtilities || ''}
                      onChange={(e) => setRentAndUtilities(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Food & Groceries</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={foodAndGroceries || ''}
                      onChange={(e) => setFoodAndGroceries(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Travel & Leisure</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={travelAndLeisure || ''}
                      onChange={(e) => setTravelAndLeisure(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Medical & Insurance</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={medicalAndInsurance || ''}
                      onChange={(e) => setMedicalAndInsurance(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Miscellaneous</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={miscellaneous || ''}
                      onChange={(e) => setMiscellaneous(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Actual Investments</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={monthlyInvestments || ''}
                      onChange={(e) => setMonthlyInvestments(e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
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
