// src/components/BusinessProfile.jsx
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, TrendingUp, TrendingDown, Building, User } from 'lucide-react';

export default function BusinessProfile({ data }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ content: () => printRef.current, documentTitle: `${data.businessName}_Report` });

  const totalExpenses = Number(data.rent || 0) + Number(data.utilities || 0) + Number(data.supply || 0);
  const netIncome = Number(data.income || 0) - totalExpenses;

  return (
    <div className="glass-card">
      {/* --- ON-SCREEN FUTURISTIC HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(to right, white, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {data.businessName}
          </h1>
          <span style={{ color: 'var(--accent-purple)', letterSpacing: '2px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
             // {data.llcName}
          </span>
        </div>
        <button onClick={handlePrint} className="btn-modern" style={{ background: 'var(--accent-green)' }}>
          <Printer size={20} /> EXPORT PDF
        </button>
      </div>

      {/* --- ON-SCREEN FUTURISTIC DASHBOARD --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
         <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', marginTop: 0 }}><User size={18}/> Owner Entity</h3>
            <p style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>{data.ownerName}</p>
            <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>{data.ownerPhone}</div>
            <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>{data.ownerAddress}</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp /> GROSS INCOME</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${Number(data.income).toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingDown /> EXPENSES</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${totalExpenses.toLocaleString()}</div>
          </div>
           <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: 'var(--accent-cyan)' }}>NET FLOW ESTIMATE</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${netIncome.toLocaleString()}</div>
          </div>
      </div>

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
                    <p><strong>Name:</strong> {data.ownerName}</p>
                    <p><strong>Phone:</strong> {data.ownerPhone}</p>
                    <p><strong>Private Address:</strong><br/>{data.ownerAddress}</p>
                </div>
                <div>
                     <h3 style={{ background: '#eee', padding: '10px' }}>Business Location</h3>
                     <p><strong>Physical Address:</strong><br/>{data.businessAddress}</p>
                </div>
            </div>

            <h3 style={{ background: '#eee', padding: '10px' }}>Financial Monthly Report</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <tbody>
                    <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Gross Income</td><td style={{padding: '8px', fontWeight: 'bold', color: 'green'}}>${Number(data.income).toLocaleString()}</td></tr>
                    <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Rent</td><td style={{padding: '8px'}}>${Number(data.rent).toLocaleString()}</td></tr>
                    <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Utilities</td><td style={{padding: '8px'}}>${Number(data.utilities).toLocaleString()}</td></tr>
                    <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Supplies</td><td style={{padding: '8px'}}>${Number(data.supply).toLocaleString()}</td></tr>
                    <tr style={{background: '#f9f9f9', fontWeight: 'bold'}}><td style={{padding: '15px 8px'}}>ESTIMATED NET INCOME</td><td style={{padding: '15px 8px'}}>${netIncome.toLocaleString()}</td></tr>
                </tbody>
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