// src/components/AddResidenceForm.jsx
import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Save, Loader2, PlusCircle, XCircle, ImagePlus } from 'lucide-react';

const createInitialState = () => ({
  propertyAddress: '',
  ownerName: '',
  llcName: '',
  ownerMailingAddress: '',
  phoneNumber: '',
  email: '',
  // Acquisition
  datePurchased: '',
  purchasePrice: '',
  closingCosts: '',
  dueDiligence: '',
  // Rehab
  rehabBudget: '',
  rehabContingency: '',
  rehabTimeline: '',
  // Values
  askingPrice: '',
  arv: '', // After Repair Value
  // Holding Costs
  holdingUtilities: '',
  holdingLawnSnow: '',
  holdingInsurance: '',
  // Property Details
  yearBuilt: '',
  squareFootage: '',
  bedsBaths: '',
  lotSize: '',
  // Ongoing Expenses
  propertyTax: '',
  insurance: '',
  marketRent: '',
  notes: '',
  loans: [{ loanAmount: '', interestRate: '', term: '' }],
  imageUrls: [],
});

export default function AddResidenceForm({ onSaved, residenceToEdit }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(createInitialState());
  const [imageSlots, setImageSlots] = useState(Array(8).fill(null));
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    if (residenceToEdit) {
      setFormData({
        ...createInitialState(),
        ...residenceToEdit,
        loans: residenceToEdit.loans?.length ? residenceToEdit.loans : [{ loanAmount: '', interestRate: '', term: '' }],
      });
      const newImageSlots = Array(8).fill(null);
      if (residenceToEdit.imageUrls) {
        residenceToEdit.imageUrls.forEach((url, i) => {
          if (i < 8) newImageSlots[i] = { url, file: null };
        });
      }
      setImageSlots(newImageSlots);
    } else {
      setFormData(createInitialState());
      setImageSlots(Array(8).fill(null));
    }
    setImagesToDelete([]);
  }, [residenceToEdit, onSaved]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLoanChange = (index, e) => {
    const newLoans = [...formData.loans];
    newLoans[index][e.target.name] = e.target.value;
    setFormData({ ...formData, loans: newLoans });
  };

  const addLoan = () => {
    setFormData({ ...formData, loans: [...formData.loans, { loanAmount: '', interestRate: '', term: '' }] });
  };

  const removeLoan = (index) => {
    if (formData.loans.length > 1) {
      const newLoans = [...formData.loans];
      newLoans.splice(index, 1);
      setFormData({ ...formData, loans: newLoans });
    }
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const newImageSlots = [...imageSlots];
      newImageSlots[index] = { url: URL.createObjectURL(file), file: file };
      setImageSlots(newImageSlots);
    }
  };

  const removeImage = (index) => {
    const newImageSlots = [...imageSlots];
    const slotToRemove = newImageSlots[index];
    if (slotToRemove && slotToRemove.file === null && slotToRemove.url.startsWith('https://firebasestorage.googleapis.com')) {
      setImagesToDelete(prev => [...prev, slotToRemove.url]);
    }
    newImageSlots[index] = null;
    setImageSlots(newImageSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice) || null,
        closingCosts: Number(formData.closingCosts) || null,
        dueDiligence: Number(formData.dueDiligence) || null,
        rehabBudget: Number(formData.rehabBudget) || null,
        rehabContingency: Number(formData.rehabContingency) || null,
        rehabTimeline: Number(formData.rehabTimeline) || null,
        askingPrice: Number(formData.askingPrice) || null,
        arv: Number(formData.arv) || null,
        holdingUtilities: Number(formData.holdingUtilities) || null,
        holdingLawnSnow: Number(formData.holdingLawnSnow) || null,
        holdingInsurance: Number(formData.holdingInsurance) || null,
        yearBuilt: Number(formData.yearBuilt) || null,
        squareFootage: Number(formData.squareFootage) || null,
        propertyTax: Number(formData.propertyTax) || null,
        insurance: Number(formData.insurance) || null,
        marketRent: Number(formData.marketRent) || null,
        loans: formData.loans.filter(l => l.loanAmount || l.interestRate || l.term),
      };

      const residenceId = residenceToEdit ? residenceToEdit.id : doc(collection(db, 'residences')).id;
      const uploadedImageUrls = [];

      for (const slot of imageSlots) {
        if (slot) {
          if (slot.file) {
            const imageRef = ref(storage, `residences/${residenceId}/${Date.now()}_${slot.file.name}`);
            await uploadBytes(imageRef, slot.file);
            const downloadURL = await getDownloadURL(imageRef);
            uploadedImageUrls.push(downloadURL);
          } else if (slot.url) {
            uploadedImageUrls.push(slot.url);
          }
        }
      }
      dataToSave.imageUrls = uploadedImageUrls;

      for (const urlToDelete of imagesToDelete) {
        try {
          const imageRef = ref(storage, urlToDelete);
          await deleteObject(imageRef);
        } catch (deleteError) {
          console.warn("Could not delete image:", deleteError.message);
        }
      }

      if (residenceToEdit) {
        const residenceRef = doc(db, "residences", residenceToEdit.id);
        await updateDoc(residenceRef, { ...dataToSave, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "residences"), { ...dataToSave, createdAt: new Date() });
      }
      onSaved();
    } catch (error) {
      alert("Error saving residence: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginTop: 0, color: 'var(--accent-cyan)' }}>{residenceToEdit ? '// EDIT RESIDENCE' : '// NEW RESIDENCE'}</h2>
      <form onSubmit={handleSubmit}>
        {/* Property & Owner Info */}
        <div className="input-group"><label className="input-label">Property Address</label><input className="modern-input" name="propertyAddress" value={formData.propertyAddress} required onChange={handleChange} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group"><label className="input-label">Owner Name</label><input className="modern-input" name="ownerName" value={formData.ownerName} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">LLC Name (if applicable)</label><input className="modern-input" name="llcName" value={formData.llcName} onChange={handleChange} /></div>
        </div>
        <div className="input-group"><label className="input-label">Owner Mailing Address</label><input className="modern-input" name="ownerMailingAddress" value={formData.ownerMailingAddress} onChange={handleChange} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group"><label className="input-label">Phone Number</label><input className="modern-input" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Email</label><input className="modern-input" type="email" name="email" value={formData.email} onChange={handleChange} /></div>
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        {/* Acquisition & Rehab */}
        <h3 style={{ color: 'var(--accent-green)' }}>// ACQUISITION & REHAB</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="input-group"><label className="input-label">Date Purchased</label><input className="modern-input" type="date" name="datePurchased" value={formData.datePurchased} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Purchase Price ($)</label><input className="modern-input" type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Closing Costs ($)</label><input className="modern-input" type="number" name="closingCosts" value={formData.closingCosts} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Due Diligence ($)</label><input className="modern-input" type="number" name="dueDiligence" value={formData.dueDiligence} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Rehab Budget ($)</label><input className="modern-input" type="number" name="rehabBudget" value={formData.rehabBudget} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Contingency (%)</label><input className="modern-input" type="number" name="rehabContingency" value={formData.rehabContingency} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Rehab Timeline (months)</label><input className="modern-input" type="number" name="rehabTimeline" value={formData.rehabTimeline} onChange={handleChange} /></div>
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        {/* Financial Info */}
        <h3 style={{ color: 'var(--accent-green)' }}>// VALUE & ONGOING EXPENSES</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="input-group"><label className="input-label">Asking Price ($)</label><input className="modern-input" type="number" name="askingPrice" value={formData.askingPrice} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">After Repair Value (ARV)</label><input className="modern-input" type="number" name="arv" value={formData.arv} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Property Tax / Year ($)</label><input className="modern-input" type="number" name="propertyTax" value={formData.propertyTax} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Insurance / Year ($)</label><input className="modern-input" type="number" name="insurance" value={formData.insurance} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Possible Market Rent ($)</label><input className="modern-input" type="number" name="marketRent" value={formData.marketRent} onChange={handleChange} /></div>
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        {/* Property Details */}
        <h3 style={{ color: 'var(--accent-cyan)' }}>// PROPERTY DETAILS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div className="input-group"><label className="input-label">Year Built</label><input className="modern-input" type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Square Footage</label><input className="modern-input" type="number" name="squareFootage" value={formData.squareFootage} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Beds / Baths</label><input className="modern-input" name="bedsBaths" value={formData.bedsBaths} onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Lot Size</label><input className="modern-input" name="lotSize" value={formData.lotSize} onChange={handleChange} /></div>
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        {/* Loan Info */}
        <h3 style={{ color: 'var(--accent-purple)' }}>// LOAN INFORMATION</h3>
        {formData.loans.map((loan, index) => (
          <div key={index} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '20px', position: 'relative' }}>
            {formData.loans.length > 1 && <XCircle color="#f87171" size={20} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => removeLoan(index)} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div className="input-group"><label className="input-label">Loan Amount ($)</label><input className="modern-input" type="number" name="loanAmount" value={loan.loanAmount} onChange={(e) => handleLoanChange(index, e)} /></div>
              <div className="input-group"><label className="input-label">Interest Rate (%)</label><input className="modern-input" type="number" name="interestRate" value={loan.interestRate} onChange={(e) => handleLoanChange(index, e)} /></div>
              <div className="input-group"><label className="input-label">Term (years)</label><input className="modern-input" type="number" name="term" value={loan.term} onChange={(e) => handleLoanChange(index, e)} /></div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addLoan} className="btn-modern-subtle" style={{ marginBottom: '20px' }}><PlusCircle size={16} /> Add Loan</button>

        <div className="input-group"><label className="input-label">Notes</label><textarea className="modern-input" name="notes" value={formData.notes} onChange={handleChange} rows="4"></textarea></div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        {/* Image Upload */}
        <h3 style={{ color: 'var(--accent-purple)' }}>// IMAGES (UP TO 8)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          {imageSlots.map((slot, index) => (
            <div key={index} className="image-slot">
              {slot ? (
                <>
                  <img src={slot.url} alt={`Upload preview ${index + 1}`} />
                  <button type="button" className="remove-image-btn" onClick={() => removeImage(index)}><XCircle size={20} /></button>
                </>
              ) : (
                <label className="upload-label">
                  <ImagePlus size={30} />
                  <span>Add Image</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(index, e)} />
                </label>
              )}
            </div>
          ))}
        </div>

        <button type="submit" className="btn-modern" disabled={loading} style={{ width: '100%', marginTop: '30px', fontSize: '1.1rem' }}>
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {residenceToEdit ? 'UPDATE RESIDENCE' : 'SAVE RESIDENCE'}</>}
        </button>
      </form>
    </div>
  );
}