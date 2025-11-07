// src/components/ResidenceProfile.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Home, User, DollarSign, Percent, FileText, Image, ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DetailItem = ({ label, value, isCurrency = false, isPercent = false }) => (
  value || value === 0 ? <p><strong>{label}:</strong> {isCurrency ? `$${Number(value).toLocaleString()}` : (isPercent ? `${value}%` : value)}</p> : null
);

const DetailSection = ({ icon, title, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', marginTop: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
      {icon} {title}
    </h3>
    <div style={{ paddingLeft: '34px', opacity: 0.9 }}>{children}</div>
  </div>
);

export default function ResidenceProfile({ data, onDelete, onEdit }) {
  // Calculations based on the new spec
  const purchasePrice = Number(data.purchasePrice) || 0;
  const closingCosts = Number(data.closingCosts) || 0;
  const totalAcquisitionCost = purchasePrice + closingCosts;

  const rehabBudget = (data.rehabItems || []).reduce((acc, item) => acc + (Number(item.cost) || 0), 0);
  const rehabContingency = Number(data.rehabContingency) || 0;
  const totalRehabCost = rehabBudget * (1 + rehabContingency / 100);

  const totalProjectCost = totalAcquisitionCost + totalRehabCost;

  // Simplified holding costs for now
  const holdingUtilities = (Number(data.holdingUtilities) || 0) * (Number(data.rehabTimeline) || 0);
  const holdingInsurance = (Number(data.holdingInsurance) / 12) * (Number(data.rehabTimeline) || 0);
  const totalHoldingCost = holdingUtilities + holdingInsurance;

  const totalCashNeeded = totalProjectCost + totalHoldingCost; // Simplified, ignoring financing for now

  const arv = Number(data.arv) || 0;
  const marketRent = Number(data.marketRent) || 0;
  const propertyTax = Number(data.propertyTax) || 0;
  const insurance = Number(data.insurance) || 0;

  const [viewerState, setViewerState] = useState({ isOpen: false, index: 0 });

  const openViewer = (index) => setViewerState({ isOpen: true, index });
  const closeViewer = () => setViewerState({ isOpen: false, index: 0 });

  const showNextImage = (e) => {
    e.stopPropagation();
    setViewerState(prev => ({ ...prev, index: (prev.index + 1) % data.imageUrls.length }));
  };

  const showPrevImage = (e) => {
    e.stopPropagation();
    setViewerState(prev => ({ ...prev, index: (prev.index - 1 + data.imageUrls.length) % data.imageUrls.length }));
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

  return (
    <div className="glass-card">
      <AnimatePresence>
        {viewerState.isOpen && data.imageUrls?.length > 0 && (
          <motion.div className="image-viewer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeViewer}>
            <button className="viewer-close-btn" onClick={closeViewer}><X size={32} /></button>
            <button className="viewer-nav-btn prev" onClick={showPrevImage}><ChevronLeft size={48} /></button>
            <motion.img src={data.imageUrls[viewerState.index]} alt={`Full screen view ${viewerState.index + 1}`} onClick={(e) => e.stopPropagation()} />
            <button className="viewer-nav-btn next" onClick={showNextImage}><ChevronRight size={48} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(to right, white, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {data.propertyAddress}
          </h1>
          <span style={{ color: 'var(--accent-purple)', letterSpacing: '2px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
             // REAL ESTATE DOSSIER
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onEdit(data)} className="btn-modern" style={{ background: 'var(--accent-blue)' }}><Edit size={20} /> EDIT</button>
          <button onClick={() => onDelete(data.id)} className="btn-modern" style={{ background: 'var(--accent-red)' }}><Trash2 size={20} /> DELETE</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingDown /> TOTAL PROJECT COST</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${totalProjectCost.toLocaleString()}</div>
          </div>
           <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: 'var(--accent-cyan)' }}><Briefcase /> TOTAL CASH NEEDED</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${totalCashNeeded.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)', padding: '20px', borderRadius: '16px' }}>
             <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp /> AFTER REPAIR VALUE (ARV)</div>
             <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${arv.toLocaleString()}</div>
          </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
        <DetailSection icon={<User size={18} />} title="Ownership">
          <DetailItem label="Owner Name" value={data.ownerName} />
          <DetailItem label="LLC Name" value={data.llcName} />
          <DetailItem label="Mailing Address" value={data.ownerMailingAddress} />
          <DetailItem label="Phone" value={data.phoneNumber} />
          <DetailItem label="Email" value={data.email} />
        </DetailSection>

        <DetailSection icon={<Home size={18} />} title="Property Details">
          <DetailItem label="Year Built" value={data.yearBuilt} />
          <DetailItem label="Square Footage" value={data.squareFootage} />
          <DetailItem label="Beds / Baths" value={data.bedsBaths} />
          <DetailItem label="Lot Size" value={data.lotSize} />
        </DetailSection>

        <DetailSection icon={<DollarSign size={18} />} title="Acquisition & Rehab">
          <DetailItem label="Date Purchased" value={data.datePurchased} />
          <DetailItem label="Purchase Price" value={data.purchasePrice} isCurrency />
          <DetailItem label="Closing Costs" value={data.closingCosts} isCurrency />
          <DetailItem label="Rehab Contingency" value={data.rehabContingency} isPercent />
          <DetailItem label="Total Rehab" value={totalRehabCost} isCurrency />
          <DetailItem label="Rehab Timeline" value={data.rehabTimeline ? `${data.rehabTimeline} months` : null} />
        </DetailSection>

        <DetailSection icon={<DollarSign size={18} />} title="Financials">
          <DetailItem label="Asking Price" value={data.askingPrice} isCurrency />
          <DetailItem label="After Repair Value (ARV)" value={data.arv} isCurrency />
          <DetailItem label="Property Tax/Year" value={data.propertyTax} isCurrency />
          <DetailItem label="Insurance/Year" value={data.insurance} isCurrency />
          <DetailItem label="Market Rent" value={data.marketRent} isCurrency />
        </DetailSection>

        {data.loans && data.loans.length > 0 && (
          <DetailSection icon={<Percent size={18} />} title="Loan Information">
            {data.loans.map((loan, i) => (
              <div key={i} style={{ borderLeft: '2px solid var(--accent-purple)', paddingLeft: '15px', marginBottom: '15px' }}>
                <p><strong>Loan {i + 1}</strong></p>
                <DetailItem label="Amount" value={loan.loanAmount} isCurrency />
                <DetailItem label="Interest Rate" value={loan.interestRate ? `${loan.interestRate}%` : null} />
                <DetailItem label="Term" value={loan.term ? `${loan.term} years` : null} />
              </div>
            ))}
          </DetailSection>
        )}

        {data.notes && (
          <DetailSection icon={<FileText size={18} />} title="Notes">
            <p style={{ whiteSpace: 'pre-wrap' }}>{data.notes}</p>
          </DetailSection>
        )}
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
                <img src={url} alt={`Residence image ${index + 1}`} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px' }} />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}