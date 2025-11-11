// src/components/ResidenceProfile.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Trash2, Edit, Home, User, DollarSign, Percent, FileText, Image, ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrrrCalculator from './BrrrCalculator';
import FlipCalculator from './FlipCalculator';

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
  const printRef = useRef();
  const handlePrint = useReactToPrint({ content: () => printRef.current, documentTitle: `${data.propertyAddress}_Profile` });

  // Calculations based on the new spec
  const purchasePrice = Number(data.purchasePrice) || 0;
  const closingPercent = Number(data.closingCostsPercent) || 0;
  const inspectionPercent = Number(data.inspectionPercent) || 0;
  const closingEstimate = closingPercent ? purchasePrice * closingPercent / 100 : 0;
  const inspectionEstimate = inspectionPercent ? purchasePrice * inspectionPercent / 100 : 0;
  const recordedClosing = Number(data.closingCosts) || closingEstimate;
  const totalAcquisitionCost = purchasePrice + recordedClosing + inspectionEstimate;

  const rehabLineItems = (data.rehabItems || []).reduce((acc, item) => acc + (Number(item.cost) || 0), 0);
  const rehabBudget = Number(data.rehabBudgetQuick) || rehabLineItems;
  const rehabContingency = Number(data.rehabContingency) || 0;
  const totalRehabCost = rehabBudget * (rehabContingency ? 1 + rehabContingency / 100 : 1);

  const holdingPercent = Number(data.holdingPercent) || 0;
  const holdingMonthly =
    holdingPercent > 0 && purchasePrice > 0
      ? purchasePrice * (holdingPercent / 100)
      : Number(data.holdingUtilities) || 0;
  const holdingMonths = Number(data.rehabTimeline) || 0;
  const totalHoldingCost = holdingMonthly * holdingMonths;
  const totalProjectCost = totalAcquisitionCost + totalRehabCost + totalHoldingCost;

  const totalCashNeeded = totalProjectCost; // Simplified, ignoring financing nuance

  const arv = Number(data.arv) || 0;
  const marketRent = Number(data.marketRent) || 0;
  const propertyTax = Number(data.propertyTax) || 0;
  const insurance = Number(data.insurance) || 0;
  const rentRollTotal = (data.rentRoll || []).reduce((sum, unit) => sum + (Number(unit.rent) || 0), 0);
  const rentMonthly = Number(data.rentMonthly) || marketRent;
  const otherIncome = Number(data.otherIncomeMonthly) || 0;
  const blendedRent = rentRollTotal || rentMonthly + otherIncome;
  const vacancyPercent = data.vacancyPercent;
  const opExPercent = data.opExPercent;
  const ownerPhone = data.ownerPhone || data.phoneNumber;
  const ownerEmail = data.ownerEmail || data.email;
  const propertyFullAddress = [
    data.propertyAddress,
    data.propertyCity,
    data.propertyState,
    data.propertyZip,
  ].filter(Boolean).join(', ');
  const dataSources = Array.isArray(data.dataSources) ? data.dataSources : [];
  const bedsBathsDisplay =
    data.beds && data.baths ? `${data.beds} / ${data.baths}` : data.bedsBaths;
  const fundingModeLabel = {
    hardMoney: 'Hard Money Bridge',
    investorDebt: 'Investor - Debt',
    investorEquity: 'Investor - Equity',
    allCash: 'All Cash Acquisition',
  }[data.fundingMode] || 'Custom Mix';
  const allCashPlan =
    typeof data.allCashFlag === 'boolean' ? data.allCashFlag : false;

  const [viewerState, setViewerState] = useState({ isOpen: false, index: 0 });
  const [calcTab, setCalcTab] = useState(data.projectStrategy === 'Flip' ? 'flip' : 'brrr');

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
    <div className="glass-card screen-only">
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
          <button onClick={handlePrint} className="btn-modern" style={{ background: 'var(--accent-green)' }}>
            <Printer size={20} /> EXPORT PDF
          </button>
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
        <DetailSection icon={<User size={18} />} title="Owner / Entity">
          <DetailItem label="Owner / Entity" value={data.ownerName} />
          <DetailItem label="Entity Type" value={data.owningEntityType || 'Individual'} />
          <DetailItem label="LLC Name" value={data.llcName} />
          <DetailItem label="Mailing Address" value={data.ownerMailingAddress} />
          <DetailItem label="Phone" value={ownerPhone} />
          <DetailItem label="Email" value={ownerEmail} />
          {dataSources.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Data Sources:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {dataSources.map((source) => (
                  <span key={source} style={{ padding: '4px 10px', borderRadius: '999px', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
        </DetailSection>

        <DetailSection icon={<Home size={18} />} title="Property Snapshot">
          <DetailItem label="Address" value={propertyFullAddress || data.propertyAddress} />
          <DetailItem label="County" value={data.propertyCounty} />
          <DetailItem label="APN" value={data.propertyApn} />
          <DetailItem label="Year Built" value={data.yearBuilt} />
          <DetailItem label="Square Footage" value={data.squareFootage} />
          <DetailItem label="Beds / Baths" value={bedsBathsDisplay} />
          <DetailItem label="Lot Size" value={data.lotSize} />
          <DetailItem label="Zoning" value={data.zoning} />
        </DetailSection>

        <DetailSection icon={<DollarSign size={18} />} title="Acquisition History">
          <DetailItem label="Date Purchased" value={data.datePurchased} />
          <DetailItem label="Last Recorded Sale" value={data.lastSaleDate} />
          <DetailItem label="Last Sale Price" value={data.lastSalePrice} isCurrency />
          <DetailItem label="Closing Costs (est)" value={recordedClosing} isCurrency />
          <DetailItem label="Inspection / Misc" value={inspectionEstimate} isCurrency />
          <DetailItem label="Strategy" value={data.projectStrategy} />
          <DetailItem label="Seller / Transfer" value={data.sellerName} />
          {data.recordedDeedLink && (
            <p>
              <strong>Deed:</strong>{' '}
              <a href={data.recordedDeedLink} target="_blank" rel="noreferrer">
                View recorded document
              </a>
            </p>
          )}
        </DetailSection>

        <DetailSection icon={<Briefcase size={18} />} title="Deal Pipeline">
          <DetailItem label="Asking Price" value={data.askingPrice} isCurrency />
          <DetailItem label="Lead Source" value={data.leadSource} />
          <DetailItem label="Seller Motivation" value={data.motivation} />
          {data.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{data.notes}</p>}
        </DetailSection>

        <DetailSection icon={<TrendingUp size={18} />} title="BRRR Inputs">
          <DetailItem label="After Repair Value (ARV)" value={arv} isCurrency />
          <DetailItem label="Rehab Budget" value={rehabBudget} isCurrency />
          <DetailItem label="Rehab Contingency" value={rehabContingency} isPercent />
          <DetailItem label="Closing Costs %" value={closingPercent} isPercent />
          <DetailItem label="Inspection / Misc %" value={inspectionPercent} isPercent />
          <DetailItem label="Holding Monthly %" value={holdingPercent} isPercent />
          <DetailItem label="Rent Plan" value={rentMonthly} isCurrency />
          <DetailItem label="Other Income" value={otherIncome} isCurrency />
          <DetailItem label="Vacancy %" value={vacancyPercent} isPercent />
          <DetailItem label="OpEx %" value={opExPercent} isPercent />
          <DetailItem label="Bridge LTV %" value={data.bridgeLtvPercent} isPercent />
          <DetailItem label="Refi LTV %" value={data.dscrRefiLtvPercent} isPercent />
          <DetailItem label="Refi Rate %" value={data.dscrRefiRatePercent} isPercent />
          <DetailItem label="DSCR Min" value={data.dscrRefiTarget} />
          <DetailItem label="Funding Mode" value={fundingModeLabel} />
          <DetailItem label="All-Cash Hold" value={allCashPlan ? 'Yes' : 'No'} />
        </DetailSection>

        {data.rentRoll?.length > 0 && (
          <DetailSection icon={<DollarSign size={18} />} title="Rent Roll">
            {data.rentRoll.map((unit, idx) => (
              <p key={`${unit.label || idx}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '4px 0' }}>
                <span>{unit.label || `Unit ${idx + 1}`}</span>
                <span>${Number(unit.rent || 0).toLocaleString()}</span>
              </p>
            ))}
            <p style={{ marginTop: '8px', fontWeight: 'bold' }}>
              Total: ${Number(blendedRent || 0).toLocaleString()}
            </p>
          </DetailSection>
        )}

        {data.loans && data.loans.length > 0 && (
          <DetailSection icon={<Percent size={18} />} title="Capital Stack">
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

      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {['brrr', 'flip'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setCalcTab(mode)}
            className={`rounded-full border px-4 py-1 text-sm ${
              calcTab === mode
                ? 'border-cyan-400 text-cyan-200'
                : 'border-white/20 text-white/70'
            }`}
          >
            {mode === 'brrr' ? 'BRRR' : 'Flip'}
          </button>
        ))}
      </div>

      <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />
      {calcTab === 'brrr' ? (
        <BrrrCalculator residence={data} />
      ) : (
        <FlipCalculator residence={data} />
      )}

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

      {/* ================================================================================= */}
      {/* HIDDEN PRINT CONTAINER                                                            */}
      {/* ================================================================================= */}
      <div className="print-only">
        <div ref={printRef} className="print-container" style={{ padding: '40px', color: 'black', background: 'white', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ borderBottom: '3px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>{data.propertyAddress}</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', margin: '40px 0' }}>
                <div>
                    <h3 style={{ background: '#eee', padding: '10px' }}>Ownership</h3>
                    <DetailItem label="Owner / Entity" value={data.ownerName} />
                    <DetailItem label="Entity Type" value={data.owningEntityType || 'Individual'} />
                    <DetailItem label="LLC Name" value={data.llcName} />
                    <DetailItem label="Mailing Address" value={data.ownerMailingAddress} />
                    <DetailItem label="Phone" value={ownerPhone} />
                    <DetailItem label="Email" value={ownerEmail} />
                </div>
                <div>
                     <h3 style={{ background: '#eee', padding: '10px' }}>Property Details</h3>
                    <DetailItem label="Address" value={propertyFullAddress || data.propertyAddress} />
                    <DetailItem label="County" value={data.propertyCounty} />
                    <DetailItem label="APN" value={data.propertyApn} />
                    <DetailItem label="Year Built" value={data.yearBuilt} />
                    <DetailItem label="Square Footage" value={data.squareFootage} />
                    <DetailItem label="Beds / Baths" value={bedsBathsDisplay} />
                    <DetailItem label="Lot Size" value={data.lotSize} />
                    <DetailItem label="Zoning" value={data.zoning} />
                </div>
            </div>

            <h3 style={{ background: '#eee', padding: '10px' }}>Acquisition & Rehab</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <tbody>
                <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Date Purchased</td><td style={{padding: '8px'}}>{data.datePurchased}</td></tr>
                <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Purchase Price</td><td style={{padding: '8px'}}>${purchasePrice.toLocaleString()}</td></tr>
                <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Closing Costs</td><td style={{padding: '8px'}}>${recordedClosing.toLocaleString()}</td></tr>
                <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Inspection / Misc</td><td style={{padding: '8px'}}>${inspectionEstimate.toLocaleString()}</td></tr>
                <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Rehab Budget</td><td style={{padding: '8px'}}>${rehabBudget.toLocaleString()}</td></tr>
                <tr style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '8px'}}>Rehab Contingency</td><td style={{padding: '8px'}}>{rehabContingency}%</td></tr>
                <tr style={{background: '#f0f0f0', fontWeight: 'bold'}}><td style={{padding: '15px 8px'}}>Total Rehab Cost</td><td style={{padding: '15px 8px'}}>${totalRehabCost.toLocaleString()}</td></tr>
                <tr style={{background: '#e0e0e0', fontWeight: 'bold', borderTop: '2px solid #333'}}><td style={{padding: '15px 8px'}}>TOTAL PROJECT COST</td><td style={{padding: '15px 8px'}}>${totalProjectCost.toLocaleString()}</td></tr>
              </tbody>
            </table>

            {data.rehabItems && data.rehabItems.length > 0 && (
              <>
                <h3 style={{ background: '#eee', padding: '10px', marginTop: '30px' }}>Rehab Items</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr style={{background: '#ddd'}}>
                      <th style={{padding: '8px', textAlign: 'left'}}>Category</th>
                      <th style={{padding: '8px', textAlign: 'left'}}>Item</th>
                      <th style={{padding: '8px', textAlign: 'right'}}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rehabItems.map((item, i) => (
                      <tr key={i} style={{borderBottom: '1px solid #ddd'}}>
                        <td style={{padding: '8px'}}>{item.category}</td>
                        <td style={{padding: '8px'}}>{item.name}</td>
                        <td style={{padding: '8px', textAlign: 'right'}}>${Number(item.cost || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div style={{marginTop: '50px', fontSize: '12px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px'}}>
                Document generated by Nexus Research V2.0 on {new Date().toLocaleDateString()}
            </div>
        </div>
      </div>
    </div>
  );
}
