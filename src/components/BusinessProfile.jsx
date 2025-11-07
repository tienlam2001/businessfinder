// src/components/BusinessProfile.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Trash2, Edit, TrendingUp, TrendingDown, Building, User, Image, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BusinessProfile({ data, onDelete, onEdit }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ content: () => printRef.current, documentTitle: `${data.businessName}_Report` });

  // Default to 'MonthlyMultiple' if mode is not set for backward compatibility
  const financialsMode = data.financialsMode || 'MonthlyMultiple';

  // Handle old data structures
  const financials = (data.financials && data.financials.length > 0)
    ? data.financials : [{
      year: data.yearEstablished, month: 'N/A', income: data.income,
      rent: data.rent, utilities: data.utilities, supply: data.supply
    }];

  const totalIncome = financials.reduce((acc, item) => acc + Number(item.income || 0), 0);  
  const laborExpenseValue = Number(data.laborExpenseValue) || 0;
  const laborExpense = data.laborExpenseType === 'Percent'
    ? totalIncome * (laborExpenseValue / 100)
    : laborExpenseValue;

  const baseExpenses = financials.reduce((acc, item) => acc + Number(item.rent || 0) + Number(item.utilities || 0) + Number(item.supply || 0), 0);
  const totalExpenses = baseExpenses + laborExpense;
  const netIncome = totalIncome - totalExpenses;

  const askingPrice = Number(data.askingPrice) || 0;
  const capex = Number(data.capex) || 0;
  const totalInvestment = askingPrice + capex;

  let incomePeriodLabel = 'Total';
  let annualCashFlow = netIncome;
  if (financialsMode === 'Annual') {
    incomePeriodLabel = 'Annual';
  } else if (financialsMode === 'Monthly') {
    incomePeriodLabel = 'Monthly';
    annualCashFlow = netIncome * 12;
  } else if (financialsMode === 'MonthlyMultiple' && financials.length > 0) {
    // Annualize by averaging the monthly net and multiplying by 12
    annualCashFlow = (netIncome / financials.length) * 12;
  }

  const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;

  const [viewerState, setViewerState] = useState({ isOpen: false, index: 0 });

  const openViewer = (index) => {
    setViewerState({ isOpen: true, index });
  };

  const closeViewer = () => {
    setViewerState({ isOpen: false, index: 0 });
  };

  const showNextImage = (e) => {
    e.stopPropagation();
    setViewerState(prevState => ({
      ...prevState,
      index: (prevState.index + 1) % data.imageUrls.length,
    }));
  };

  const showPrevImage = (e) => {
    e.stopPropagation();
    setViewerState(prevState => ({
      ...prevState,
      index: (prevState.index - 1 + data.imageUrls.length) % data.imageUrls.length,
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewerState.isOpen) {
        if (e.key === 'ArrowRight') showNextImage(e);
        if (e.key === 'ArrowLeft') showPrevImage(e);
        if (e.key === 'Escape') closeViewer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerState.isOpen, viewerState.index]);

  const getReportTitle = () => {
    if (financialsMode === 'MonthlyMultiple') return 'Financial Report';
    return `Financial ${incomePeriodLabel} Report`;
  }

  return (
    <div className="glass-card">
      <AnimatePresence>
        {viewerState.isOpen && (
          <motion.div
            className="image-viewer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeViewer}
          >
            <button className="viewer-close-btn" onClick={closeViewer}><X size={32} /></button>
            
            <button className="viewer-nav-btn prev" onClick={showPrevImage}>
              <ChevronLeft size={48} />
            </button>

            <motion.img
              src={data.imageUrls[viewerState.index]}
              alt={`Full screen view ${viewerState.index + 1}`}
              onClick={(e) => e.stopPropagation()}
            />
            
            <button className="viewer-nav-btn next" onClick={showNextImage}>
              <ChevronRight size={48} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ON-SCREEN FUTURISTIC HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(to right, white, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {data.businessName}
          </h1>
          <span style={{ color: 'var(--accent-purple)', letterSpacing: '2px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
             // {data.llcName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onEdit(data)} className="btn-modern" style={{ background: 'var(--accent-blue)' }}>
            <Edit size={20} /> EDIT
          </button>
          <button onClick={() => onDelete(data.id)} className="btn-modern" style={{ background: 'var(--accent-red)' }}>
            <Trash2 size={20} /> DELETE
          </button>
          <button onClick={handlePrint} className="btn-modern" style={{ background: 'var(--accent-green)' }}>
            <Printer size={20} /> EXPORT PDF
          </button>
        </div>
      </div>

      {/* --- ON-SCREEN FUTURISTIC DASHBOARD --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
         <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', marginTop: 0 }}><User size={18}/> Owner(s)</h3>
            {(data.owners || [{name: data.ownerName, phones: [data.ownerPhone]}]).map((owner, index) => (
              <div key={index} style={{marginBottom: '15px'}}>
                <p style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{owner.name}</p>
                <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>{Array.isArray(owner.phones) ? owner.phones.join(', ') : owner.phones}</div>
              </div>
            ))}
             <div style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: 'auto' }}>{data.ownerAddress}</div>
         </div>
         <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', marginTop: 0 }}><Building size={18}/> Facility</h3>
            <p style={{ fontSize: '1.1rem', margin: '0 0 10px 0' }}>{data.businessAddress}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <span style={{ background: 'var(--bg-main)', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid var(--accent-purple)' }}>{data.status}</span>
                <span style={{ background: 'var(--bg-main)', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid var(--accent-cyan)' }}>Est. {data.yearEstablished}</span>
            </div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp /> {incomePeriodLabel.toUpperCase()} GROSS INCOME</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${totalIncome.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingDown /> {incomePeriodLabel.toUpperCase()} EXPENSES</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${totalExpenses.toLocaleString()}</div>
          </div>
           <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: 'var(--accent-cyan)' }}>{incomePeriodLabel.toUpperCase()} NET ESTIMATE</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${netIncome.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--accent-purple)', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: 'var(--accent-purple)' }}>ANNUAL CASH FLOW</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${Math.round(annualCashFlow).toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: '#eab308' }}>CASH ON CASH RETURN</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{cashOnCashReturn.toFixed(2)}%</div>
          </div>
      </div>

      {data.imageUrls && data.imageUrls.length > 0 && (
        <>
          <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-purple)', marginTop: 0 }}>
            <Image size={18}/> Gallery
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {data.imageUrls.map((url, index) => (
              <motion.div key={index} className="gallery-thumbnail" onClick={() => openViewer(index)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <img 
                  src={url} 
                  alt={`Business image ${index + 1}`} 
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px' }} 
                />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* ================================================================================= */}
      {/* HIDDEN PRINT CONTAINER - This only shows up when you actually click "Export PDF"  */}
      {/* It uses basic, clean styles that overrides the futuristic dark mode.               */}
      {/* ================================================================================= */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="print-container" style={{ padding: '40px', color: 'black', background: 'white', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ borderBottom: '3px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>{data.businessName}</h1>
            <p><strong>Official Name:</strong> {data.llcName} | <strong>Status:</strong> {data.status} | <strong>Est:</strong> {data.yearEstablished}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', margin: '40px 0' }}>
                <div>
                    <h3 style={{ background: '#eee', padding: '10px' }}>Owner Information</h3>
                    {(data.owners || [{name: data.ownerName, phones: [data.ownerPhone]}]).map((owner, index) => (
                      <div key={index} style={{marginBottom: '10px'}}>
                        <p><strong>Name:</strong> {owner.name}</p>
                        <p><strong>Phone:</strong> {Array.isArray(owner.phones) ? owner.phones.join(', ') : owner.phones}</p>
                      </div>
                    ))}
                    <p><strong>Private Address:</strong><br/>{data.ownerAddress}</p>
                </div>
                <div>
                     <h3 style={{ background: '#eee', padding: '10px' }}>Business Location</h3>
                     <p><strong>Physical Address:</strong><br/>{data.businessAddress}</p>
                </div>
            </div>

            <h3 style={{ background: '#eee', padding: '10px' }}>{getReportTitle()}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              {financialsMode === 'MonthlyMultiple' ? (
                  <>
                    <thead>
                      <tr style={{background: '#ddd'}}>
                        <th style={{padding: '8px', textAlign: 'left'}}>Period</th>
                        <th style={{padding: '8px', textAlign: 'left'}}>Income</th>
                        <th style={{padding: '8px', textAlign: 'left'}}>Expenses</th>
                        <th style={{padding: '8px', textAlign: 'left'}}>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financials.map((entry, index) => {
                        const monthlyExpenses = Number(entry.rent || 0) + Number(entry.utilities || 0) + Number(entry.supply || 0);
                        const monthlyNet = Number(entry.income || 0) - monthlyExpenses;
                        return (
                          <tr key={index} style={{borderBottom: '1px solid #ddd'}}>
                            <td style={{padding: '8px'}}>{entry.month} {entry.year}</td>
                            <td style={{padding: '8px', color: 'green'}}>${Number(entry.income || 0).toLocaleString()}</td>
                            <td style={{padding: '8px', color: 'red'}}>${monthlyExpenses.toLocaleString()}</td>
                            <td style={{padding: '8px', fontWeight: 'bold'}}>${monthlyNet.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                        <tr style={{background: '#f0f0f0', fontWeight: 'bold', borderTop: '2px solid #333'}}><td style={{padding: '15px 8px'}}>TOTALS</td><td style={{padding: '15px 8px', color: 'green'}}>${totalIncome.toLocaleString()}</td><td style={{padding: '15px 8px', color: 'red'}}>${totalExpenses.toLocaleString()}</td><td style={{padding: '15px 8px'}}>${netIncome.toLocaleString()}</td></tr>
                    </tbody>
                  </>
              ) : (
                  <tbody>
                      <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Gross Income</td><td style={{padding: '8px', fontWeight: 'bold', color: 'green'}}>${totalIncome.toLocaleString()}</td></tr>
                      <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Rent</td><td style={{padding: '8px'}}>${Number(financials[0].rent || 0).toLocaleString()}</td></tr>
                      <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Utilities</td><td style={{padding: '8px'}}>${Number(financials[0].utilities || 0).toLocaleString()}</td></tr>
                      <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Supplies</td><td style={{padding: '8px'}}>${Number(financials[0].supply || 0).toLocaleString()}</td></tr>
                      <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Labor</td><td style={{padding: '8px'}}>${Math.round(laborExpense).toLocaleString()}</td></tr>
                      {capex > 0 && <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>CapEx / Remodel</td><td style={{padding: '8px'}}>${capex.toLocaleString()}</td></tr>}
                      <tr style={{background: '#f0f0f0', fontWeight: 'bold'}}><td style={{padding: '15px 8px'}}>ESTIMATED NET</td><td style={{padding: '15px 8px'}}>${netIncome.toLocaleString()}</td></tr>
                      <tr style={{background: '#e0e0e0', fontWeight: 'bold', borderTop: '2px solid #333'}}><td style={{padding: '15px 8px'}}>PROJECTED ANNUAL CASH FLOW</td><td style={{padding: '15px 8px'}}>${Math.round(annualCashFlow).toLocaleString()}</td></tr>
                      <tr style={{background: '#e0e0e0', fontWeight: 'bold'}}><td style={{padding: '15px 8px'}}>CASH ON CASH RETURN (CoC)</td><td style={{padding: '15px 8px'}}>{cashOnCashReturn.toFixed(2)}%</td></tr>
                  </tbody>
              )}
            </table>
            <div style={{marginTop: '50px', fontSize: '12px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px'}}>
                Document generated by Nexus Research V2.0 on {new Date().toLocaleDateString()}
            </div>
        </div>
      </div>
      {/* END HIDDEN PRINT CONTAINER */}
    </div>
  );
}