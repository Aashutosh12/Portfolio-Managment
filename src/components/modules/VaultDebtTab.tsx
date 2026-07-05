import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import type { VaultCard, NomineeDetails, InsurancePolicy, LoanRecord } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculateOutstandingLoan } from '../../utils/calculations';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Eye, 
  EyeOff, 
  Users, 
  TrendingDown, 
  CreditCard
} from 'lucide-react';

export const VaultDebtTab: React.FC = () => {
  const { 
    data, 
    addVaultCard, editVaultCard, deleteVaultCard,
    addNominee, editNominee, deleteNominee,
    addInsurance, editInsurance, deleteInsurance,
    addLoan, editLoan, deleteLoan 
  } = usePortfolio();

  // Selected subtab: 'vault' | 'nominees' | 'insurances' | 'loans'
  const [subtab, setSubtab] = useState<'vault' | 'nominees' | 'insurances' | 'loans'>('vault');

  // Reveal CVVs / Card numbers state
  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  // Modal States
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isNomineeOpen, setIsNomineeOpen] = useState(false);
  const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
  const [isLoanOpen, setIsLoanOpen] = useState(false);

  // Edit references
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [editNomineeId, setEditNomineeId] = useState<string | null>(null);
  const [editInsId, setEditInsId] = useState<string | null>(null);
  const [editLoanId, setEditLoanId] = useState<string | null>(null);

  // Card Form
  const [cardName, setCardName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardNotes, setCardNotes] = useState('');

  // Nominee Form
  const [nomName, setNomName] = useState('');
  const [nomRelationship, setNomRelationship] = useState('Spouse');
  const [nomAlloc, setNomAlloc] = useState(100);
  const [nomContact, setNomContact] = useState('');
  const [nomNotes, setNomNotes] = useState('');

  // Insurance Form
  const [insCompany, setInsCompany] = useState('');
  const [insPolicyName, setInsPolicyName] = useState('');
  const [insPolicyNumber, setInsPolicyNumber] = useState('');
  const [insPremium, setInsPremium] = useState(0);
  const [insSumAssured, setInsSumAssured] = useState(0);
  const [insRenewalDate, setInsRenewalDate] = useState('');
  const [insType, setInsType] = useState<'Health' | 'Life' | 'Term' | 'Motor' | 'Home' | 'Other'>('Health');
  const [insNotes, setInsNotes] = useState('');

  // Loan Form
  const [loanBank, setLoanBank] = useState('');
  const [loanType, setLoanType] = useState<'Home' | 'Personal' | 'Car' | 'Education' | 'Other'>('Home');
  const [loanPrincipal, setLoanPrincipal] = useState(0);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(120);
  const [loanStart, setLoanStart] = useState('2024-01');
  const [loanEmi, setLoanEmi] = useState(0);
  const [loanNotes, setLoanNotes] = useState('');

  if (!data) return null;
  const currency = data.settings.currency;

  // Toggle reveal helper
  const toggleReveal = (id: string) => {
    if (revealedIds.includes(id)) {
      setRevealedIds(revealedIds.filter(i => i !== id));
    } else {
      setRevealedIds([...revealedIds, id]);
    }
  };

  // Submit Handlers
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCardId) {
      editVaultCard(editCardId, { cardName, holderName, cardNumber, expiryDate: cardExpiry, cvv: cardCvv, notes: cardNotes });
      setEditCardId(null);
    } else {
      addVaultCard({ cardName, holderName, cardNumber, expiryDate: cardExpiry, cvv: cardCvv, notes: cardNotes });
    }
    setIsCardOpen(false);
    clearCardForm();
  };

  const handleNomineeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editNomineeId) {
      editNominee(editNomineeId, { name: nomName, relationship: nomRelationship, allocationPercent: nomAlloc, contactInfo: nomContact, notes: nomNotes });
      setEditNomineeId(null);
    } else {
      addNominee({ name: nomName, relationship: nomRelationship, allocationPercent: nomAlloc, contactInfo: nomContact, notes: nomNotes });
    }
    setIsNomineeOpen(false);
    clearNomineeForm();
  };

  const handleInsuranceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editInsId) {
      editInsurance(editInsId, { company: insCompany, policyName: insPolicyName, policyNumber: insPolicyNumber, premiumAmount: insPremium, sumAssured: insSumAssured, renewalDate: insRenewalDate, type: insType, notes: insNotes });
      setEditInsId(null);
    } else {
      addInsurance({ company: insCompany, policyName: insPolicyName, policyNumber: insPolicyNumber, premiumAmount: insPremium, sumAssured: insSumAssured, renewalDate: insRenewalDate, type: insType, notes: insNotes });
    }
    setIsInsuranceOpen(false);
    clearInsuranceForm();
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto EMI calculation if 0
    let calculatedEmi = loanEmi;
    if (calculatedEmi === 0 && loanPrincipal > 0 && loanRate > 0) {
      const r = (loanRate / 12 / 100);
      calculatedEmi = Math.round((loanPrincipal * r * Math.pow(1 + r, loanTenure)) / (Math.pow(1 + r, loanTenure) - 1));
    }

    if (editLoanId) {
      editLoan(editLoanId, { bankName: loanBank, loanType, principalAmount: loanPrincipal, interestRate: loanRate, tenureMonths: loanTenure, startMonth: loanStart, emiAmount: calculatedEmi, notes: loanNotes });
      setEditLoanId(null);
    } else {
      addLoan({ bankName: loanBank, loanType, principalAmount: loanPrincipal, interestRate: loanRate, tenureMonths: loanTenure, startMonth: loanStart, emiAmount: calculatedEmi, notes: loanNotes });
    }
    setIsLoanOpen(false);
    clearLoanForm();
  };

  // Form Cleaners
  const clearCardForm = () => {
    setCardName(''); setHolderName(''); setCardNumber(''); setCardExpiry(''); setCardCvv(''); setCardNotes('');
  };
  const clearNomineeForm = () => {
    setNomName(''); setNomRelationship('Spouse'); setNomAlloc(100); setNomContact(''); setNomNotes('');
  };
  const clearInsuranceForm = () => {
    setInsCompany(''); setInsPolicyName(''); setInsPolicyNumber(''); setInsPremium(0); setInsSumAssured(0); setInsRenewalDate(''); setInsType('Health'); setInsNotes('');
  };
  const clearLoanForm = () => {
    setLoanBank(''); setLoanType('Home'); setLoanPrincipal(0); setLoanRate(8.5); setLoanTenure(120); setLoanStart('2024-01'); setLoanEmi(0); setLoanNotes('');
  };

  // Edit Setups
  const setupCardEdit = (c: VaultCard) => {
    setEditCardId(c.id); setCardName(c.cardName); setHolderName(c.holderName); setCardNumber(c.cardNumber); setCardExpiry(c.expiryDate || ''); setCardCvv(c.cvv || ''); setCardNotes(c.notes || ''); setIsCardOpen(true);
  };
  const setupNomineeEdit = (n: NomineeDetails) => {
    setEditNomineeId(n.id); setNomName(n.name); setNomRelationship(n.relationship); setNomAlloc(n.allocationPercent); setNomContact(n.contactInfo || ''); setNomNotes(n.notes || ''); setIsNomineeOpen(true);
  };
  const setupInsEdit = (i: InsurancePolicy) => {
    setEditInsId(i.id); setInsCompany(i.company); setInsPolicyName(i.policyName); setInsPolicyNumber(i.policyNumber); setInsPremium(i.premiumAmount); setInsSumAssured(i.sumAssured); setInsRenewalDate(i.renewalDate); setInsType(i.type); setInsNotes(i.notes || ''); setIsInsuranceOpen(true);
  };
  const setupLoanEdit = (l: LoanRecord) => {
    setEditLoanId(l.id); setLoanBank(l.bankName); setLoanType(l.loanType); setLoanPrincipal(l.principalAmount); setLoanRate(l.interestRate); setLoanTenure(l.tenureMonths); setLoanStart(l.startMonth); setLoanEmi(l.emiAmount); setLoanNotes(l.notes || ''); setIsLoanOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs Selector */}
      <div className="flex border-b border-slate-800 pb-px">
        <button
          onClick={() => setSubtab('vault')}
          className={`py-3 px-6 text-xs font-bold border-b-2 uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            subtab === 'vault' ? 'border-violet-500 text-white bg-slate-900/30' : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Secure Card Vault
        </button>
        <button
          onClick={() => setSubtab('nominees')}
          className={`py-3 px-6 text-xs font-bold border-b-2 uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            subtab === 'nominees' ? 'border-violet-500 text-white bg-slate-900/30' : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Nominees Allocation
        </button>
        <button
          onClick={() => setSubtab('insurances')}
          className={`py-3 px-6 text-xs font-bold border-b-2 uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            subtab === 'insurances' ? 'border-violet-500 text-white bg-slate-900/30' : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Insurances
        </button>
        <button
          onClick={() => setSubtab('loans')}
          className={`py-3 px-6 text-xs font-bold border-b-2 uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            subtab === 'loans' ? 'border-violet-500 text-white bg-slate-900/30' : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" /> Debt & Loans
        </button>
      </div>

      {/* --- PANEL RENDERS --- */}

      {/* A. SECURE CARD VAULT */}
      {subtab === 'vault' && (
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/40">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Secure Document Vault</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Encrypts ID credentials locally (PAN, Aadhar numbers) with AES-256 keys.</p>
            </div>
            <button
              onClick={() => { clearCardForm(); setEditCardId(null); setIsCardOpen(true); }}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Credentials
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.vaultCards.map((card) => {
              const showAll = revealedIds.includes(card.id);
              return (
                <div key={card.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{card.cardName}</h4>
                        <span className="text-[9px] text-slate-400 font-mono">HOLDER: {card.holderName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setupCardEdit(card)} className="text-slate-400 hover:text-white p-1"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteVaultCard(card.id)} className="text-slate-400 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/70 border border-slate-850 rounded-xl flex items-center justify-between font-mono text-sm tracking-wide text-white">
                      <span>{showAll ? card.cardNumber : `${card.cardNumber.substring(0, 4)}-xxxx-xxxx`}</span>
                      <button onClick={() => toggleReveal(card.id)} className="text-slate-400 hover:text-slate-250 p-1">
                        {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {card.expiryDate && (
                      <div className="flex gap-4 text-[10px] text-slate-400">
                        <div>EXPIRY: <span className="font-bold text-slate-200">{card.expiryDate}</span></div>
                        {card.cvv && (
                          <div>CVV: <span className="font-bold text-slate-200 font-mono">{showAll ? card.cvv : '•••'}</span></div>
                        )}
                      </div>
                    )}
                  </div>
                  {card.notes && <p className="text-[10px] text-slate-450 italic mt-3 pt-2 border-t border-slate-850">{card.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* B. NOMINEES ALLOCATION */}
      {subtab === 'nominees' && (
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/40">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asset Nominee Transmission Directory</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Ensure legal inheritance tracking for insurance policies and bank holdings.</p>
            </div>
            <button
              onClick={() => { clearNomineeForm(); setEditNomineeId(null); setIsNomineeOpen(true); }}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Nominee
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-450 font-bold uppercase tracking-wider text-[9px] bg-slate-900/40">
                  <th className="py-3 px-4">Nominee Name</th>
                  <th className="py-3 px-3">Relationship</th>
                  <th className="py-3 px-3 text-right">Allocation weight</th>
                  <th className="py-3 px-3">Contact details</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.nominees.map((nom) => (
                  <tr key={nom.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-bold text-white">{nom.name}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-350">{nom.relationship}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-violet-400">{nom.allocationPercent}%</td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono text-[10px]">{nom.contactInfo || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setupNomineeEdit(nom)} className="p-1 text-slate-450 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteNominee(nom.id)} className="p-1 text-slate-450 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. INSURANCES */}
      {subtab === 'insurances' && (
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/40">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Insurance Policies</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Health floaters and Term plans covering dependents.</p>
            </div>
            <button
              onClick={() => { clearInsuranceForm(); setEditInsId(null); setIsInsuranceOpen(true); }}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Log Policy
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.insurances.map((ins) => (
              <div key={ins.id} className="bg-slate-905 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b border-slate-800/40 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                        {ins.company}
                        <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1 rounded uppercase">{ins.type}</span>
                      </h4>
                      <p className="text-[10px] text-slate-450 mt-0.5">Policy: {ins.policyName} ({ins.policyNumber})</p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setupInsEdit(ins)} className="p-1 text-slate-400 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteInsurance(ins.id)} className="p-1 text-slate-400 hover:text-red-405"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold">SUM ASSURED</span>
                      <span className="font-bold text-white font-mono">{formatCurrency(ins.sumAssured, currency)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-semibold">PREMIUM</span>
                      <span className="font-bold text-rose-400 font-mono">{formatCurrency(ins.premiumAmount, currency)}/yr</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-450 font-mono">
                  <span>Renewal Date: {formatDate(ins.renewalDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. DEBT & LOANS */}
      {subtab === 'loans' && (
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/40">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Loan Outstanding Amortization</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Liabilities are subtracted automatically from total assets to calculate Net Worth.</p>
            </div>
            <button
              onClick={() => { clearLoanForm(); setEditLoanId(null); setIsLoanOpen(true); }}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Liabilities
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.loans.map((loan) => {
              const calc = calculateOutstandingLoan(
                loan.principalAmount,
                loan.interestRate,
                loan.tenureMonths,
                loan.startMonth
              );

              return (
                <div key={loan.id} className="bg-slate-905 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-800/40 pb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                          {loan.bankName}
                          <span className="text-[9px] bg-red-950/60 border border-red-900 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase">{loan.loanType}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Started: {loan.startMonth}</p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setupLoanEdit(loan)} className="p-1 text-slate-400 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteLoan(loan.id)} className="p-1 text-slate-400 hover:text-red-450"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-semibold">Principal</span>
                        <span className="font-semibold text-slate-300 font-mono">{formatCurrency(loan.principalAmount, currency)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-semibold">Interest</span>
                        <span className="font-semibold text-slate-350 font-mono">{loan.interestRate}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block uppercase font-semibold">EMI Cost</span>
                        <span className="font-bold text-red-450 font-mono">{formatCurrency(calc.emi, currency)}</span>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Tenure progress: {calc.monthsPaid} / {loan.tenureMonths} months paid</span>
                        <span className="text-slate-400 font-bold font-mono">{calc.monthsRemaining} months left</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-650 to-orange-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(calc.monthsPaid / loan.tenureMonths) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-between items-center text-[10px]">
                    <span className="text-slate-450 uppercase tracking-wide">Outstanding Balance</span>
                    <span className="font-black text-red-450 font-mono text-sm">{formatCurrency(calc.outstandingBalance, currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- FORMS MODALS (GENERIC COMPACT CONTAINER) --- */}

      {/* Modals 1. Secure card modal */}
      {isCardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-805">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{editCardId ? 'Edit ID / Card details' : 'Register Secure ID Card'}</h3>
              <button onClick={() => setIsCardOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCardSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-400">Card / Document name (e.g. PAN Card, Credit Card)</label>
                <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" required />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Holder Name</label>
                <input type="text" value={holderName} onChange={(e) => setHolderName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" required />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Card / ID Number</label>
                <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Expiry (MM/YY)</label>
                  <input type="text" placeholder="12/29" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">CVV</label>
                  <input type="password" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Card Notes</label>
                <textarea value={cardNotes} onChange={(e) => setCardNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCardOpen(false)} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 font-bold py-2.5 px-4 rounded-xl">Cancel</button>
                <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl">Save Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals 2. Nominee setup */}
      {isNomineeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-805">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{editNomineeId ? 'Modify Nominee Details' : 'Configure Asset Nominee'}</h3>
              <button onClick={() => setIsNomineeOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleNomineeSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-400">Nominee Full Name</label>
                <input type="text" value={nomName} onChange={(e) => setNomName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Relationship</label>
                  <select value={nomRelationship} onChange={(e) => setNomRelationship(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200">
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other Dependents</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Allocation Percent (%)</label>
                  <input type="number" min={1} max={100} value={nomAlloc} onChange={(e) => setNomAlloc(parseInt(e.target.value, 10) || 100)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Contact details (Email / Phone)</label>
                <input type="text" value={nomContact} onChange={(e) => setNomContact(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Nominee Notes</label>
                <textarea value={nomNotes} onChange={(e) => setNomNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsNomineeOpen(false)} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 font-bold py-2.5 px-4 rounded-xl">Cancel</button>
                <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl">Save Nominee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals 3. Insurance setup */}
      {isInsuranceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-805">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Insurance Premium</h3>
              <button onClick={() => setIsInsuranceOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleInsuranceSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Insurance Company</label>
                  <input type="text" value={insCompany} onChange={(e) => setInsCompany(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" required />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Policy Name</label>
                  <input type="text" value={insPolicyName} onChange={(e) => setInsPolicyName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Policy Number</label>
                  <input type="text" value={insPolicyNumber} onChange={(e) => setInsPolicyNumber(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Policy Type</label>
                  <select value={insType} onChange={(e) => setInsType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200">
                    <option value="Health">Health Insurance</option>
                    <option value="Life">Life Insurance</option>
                    <option value="Term">Term Life</option>
                    <option value="Motor">Motor / Auto</option>
                    <option value="Home">Home Insurance</option>
                    <option value="Other">Other Policy</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Sum Assured</label>
                  <input type="number" value={insSumAssured || ''} onChange={(e) => setInsSumAssured(parseInt(e.target.value, 10) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Premium Cost</label>
                  <input type="number" value={insPremium || ''} onChange={(e) => setInsPremium(parseInt(e.target.value, 10) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Next Renewal Date</label>
                <input type="date" value={insRenewalDate} onChange={(e) => setInsRenewalDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono" required />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Notes / Nominees details</label>
                <textarea value={insNotes} onChange={(e) => setInsNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsInsuranceOpen(false)} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 font-bold py-2.5 px-4 rounded-xl">Cancel</button>
                <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl">Save Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals 4. Loan setup */}
      {isLoanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-dark rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-805">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{editLoanId ? 'Modify Outstanding Loan' : 'Log Loan Liability'}</h3>
              <button onClick={() => setIsLoanOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleLoanSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Bank / Lender</label>
                  <input type="text" value={loanBank} onChange={(e) => setLoanBank(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" required />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Loan Type</label>
                  <select value={loanType} onChange={(e) => setLoanType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200">
                    <option value="Home">Home Loan</option>
                    <option value="Personal">Personal Loan</option>
                    <option value="Car">Car Loan</option>
                    <option value="Education">Education Loan</option>
                    <option value="Other">Other Liability</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Principal Amount</label>
                  <input type="number" value={loanPrincipal || ''} onChange={(e) => setLoanPrincipal(parseInt(e.target.value, 10) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Interest Rate (% p.a.)</label>
                  <input type="number" step="any" value={loanRate} onChange={(e) => setLoanRate(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Tenure (Months)</label>
                  <input type="number" value={loanTenure || ''} onChange={(e) => setLoanTenure(parseInt(e.target.value, 10) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Start Month (YYYY-MM)</label>
                  <input type="text" placeholder="2024-01" value={loanStart} onChange={(e) => setLoanStart(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">EMI Amount (Leave 0 to calculate automatically)</label>
                <input type="number" value={loanEmi || ''} onChange={(e) => setLoanEmi(parseInt(e.target.value, 10) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Notes / Prepayment terms</label>
                <textarea value={loanNotes} onChange={(e) => setLoanNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white h-20" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsLoanOpen(false)} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 font-bold py-2.5 px-4 rounded-xl">Cancel</button>
                <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl">Save Liabilities</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
