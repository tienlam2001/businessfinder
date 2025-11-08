// src/components/AddBusinessForm.jsx
import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Save, Loader2, PlusCircle, XCircle, ImagePlus } from 'lucide-react';

const initialOwnerState = { name: '', phones: [''] };
const initialFinancialsState = {
  year: new Date().getFullYear(),
  month: 'January',
  income: '',
  rent: '',
  utilities: '',
  supply: ''
};

const initialFormData = {
  businessName: '',
  llcName: '',
  businessType: 'Nail Salon',
  status: 'New Built',
  yearEstablished: new Date().getFullYear(),
  owners: [initialOwnerState],
  businessAddress: '',
  ownerAddress: '', // This seems to be a primary owner's address
  // Old financial fields are replaced by the 'financials' array
  financials: [initialFinancialsState],
  financialsMode: 'MonthlyMultiple', // 'Annual', 'Monthly', 'MonthlyMultiple'
  askingPrice: '',
  laborExpenseType: 'Percent',
  laborExpenseValue: '',
  capex: '',
  imageUrls: [],
  // Nail Salon Valuation Fields
  locationType: 'Big plaza, anchor tenant',
  processorFee: 2.5,
  commission: 60,
  incomeValuationRate: 85,
};

export default function AddBusinessForm({ onSaved, businessToEdit }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [imageSlots, setImageSlots] = useState(Array(8).fill(null));
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    if (businessToEdit) {
      // Ensure owners is an array and each owner has a phones array
      const owners = (businessToEdit.owners || [{ name: businessToEdit.ownerName || '', phones: [businessToEdit.ownerPhone || ''] }]).map(o => ({...o, phones: Array.isArray(o.phones) ? o.phones : [o.phones || '']}));

      // Determine financials mode for backward compatibility
      let financialsMode = businessToEdit.financialsMode || 'MonthlyMultiple';
      let financialsData = businessToEdit.financials;

      if (!financialsData || financialsData.length === 0) {
        // Data is in the old format, migrate it.
        if (businessToEdit.incomePeriod === 'Annually') {
          financialsMode = 'Annual';
        } else {
          // Assume old data without a period was monthly.
          financialsMode = 'Monthly';
        }
        financialsData = [{
            year: businessToEdit.yearEstablished || new Date().getFullYear(),
            month: 'January', // Default month, not used for Annual/Monthly
            income: businessToEdit.income || '',
            rent: businessToEdit.rent || '',
            utilities: businessToEdit.utilities || '',
            supply: businessToEdit.supply || ''
          }];
      } else if (financialsData.length === 1 && (businessToEdit.financialsMode === 'Annual' || businessToEdit.financialsMode === 'Monthly')) {
        // Data is already in the new single-entry format.
        financialsMode = businessToEdit.financialsMode;
      } else {
        financialsMode = 'MonthlyMultiple';
      }

      // Ensure all fields from initialFormData are present, preventing 'undefined'.
      const sanitizedData = {
        ...initialFormData,
        ...businessToEdit,
        financialsMode,
        owners,
        financials: financialsData
      };

      // Populate image slots
      const newImageSlots = Array(8).fill(null);
      if (businessToEdit.imageUrls) {
        businessToEdit.imageUrls.forEach((url, i) => {
          if (i < 8) newImageSlots[i] = { url, file: null };
        });
      }
      setImageSlots(newImageSlots);

      setFormData(sanitizedData);
    } else {
      setFormData(initialFormData);
      setImageSlots(Array(8).fill(null));
    }
    setImagesToDelete([]);
  }, [businessToEdit, onSaved]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOwnerChange = (ownerIndex, e) => {
    const { name, value } = e.target;
    const newOwners = [...formData.owners];
    newOwners[ownerIndex] = { ...newOwners[ownerIndex], [name]: value };
    setFormData({ ...formData, owners: newOwners });
  };

  const handlePhoneChange = (ownerIndex, phoneIndex, e) => {
    const { value } = e.target;
    const newOwners = [...formData.owners];
    newOwners[ownerIndex].phones[phoneIndex] = value;
    setFormData({ ...formData, owners: newOwners });
  };

  const addPhone = (ownerIndex) => {
    const newOwners = [...formData.owners];
    newOwners[ownerIndex].phones.push('');
    setFormData({ ...formData, owners: newOwners });
  };

  const removePhone = (ownerIndex, phoneIndex) => {
    const newOwners = [...formData.owners];
    if (newOwners[ownerIndex].phones.length > 1) {
      newOwners[ownerIndex].phones.splice(phoneIndex, 1);
      setFormData({ ...formData, owners: newOwners });
    }
  };

  const addOwner = () => {
    setFormData({ ...formData, owners: [...formData.owners, { ...initialOwnerState }] });
  };

  const removeOwner = (ownerIndex) => {
    if (formData.owners.length > 1) {
      const newOwners = [...formData.owners];
      newOwners.splice(ownerIndex, 1);
      setFormData({ ...formData, owners: newOwners });
    }
  };

  const handleFinancialsChange = (index, e) => {
    const { name, value } = e.target;
    const newFinancials = [...formData.financials];
    newFinancials[index] = { ...newFinancials[index], [name]: value };
    setFormData({ ...formData, financials: newFinancials });
  };

  const addFinancialEntry = () => {
    setFormData({ ...formData, financials: [...formData.financials, { ...initialFinancialsState }] });
  };

  const removeFinancialEntry = (index) => {
    if (formData.financials.length > 1) {
      const newFinancials = [...formData.financials];
      newFinancials.splice(index, 1);
      setFormData({ ...formData, financials: newFinancials });
    }
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleImageChange = (index, e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const newImageSlots = [...imageSlots];
      let currentSlotIndex = index;

      for (let i = 0; i < files.length; i++) {
        // Find the next available slot
        while (currentSlotIndex < newImageSlots.length && newImageSlots[currentSlotIndex] !== null) {
          currentSlotIndex++;
        }

        // If we found an available slot within the limit, fill it
        if (currentSlotIndex < 8) {
          const file = files[i];
          newImageSlots[currentSlotIndex] = { url: URL.createObjectURL(file), file: file };
          currentSlotIndex++; // Move to the next slot for the next file
        } else {
          break; // Stop if no more slots are available
        }
      }
      setImageSlots(newImageSlots);
    }
  };

  const removeImage = (index) => {
    const newImageSlots = [...imageSlots];
    const slotToRemove = newImageSlots[index];
    // If it's an existing image from storage, mark it for deletion
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
      // Filter out empty phone numbers before saving
      const cleanedOwners = formData.owners.map(owner => ({
        ...owner,
        phones: owner.phones.filter(phone => phone.trim() !== '')
      }));

      // Clean and convert financial entries
      const cleanedFinancials = formData.financials.map(entry => {
        const newEntry = { ...entry };
        for (const key of ['income', 'rent', 'utilities', 'supply', 'year']) {
            const numValue = Number(newEntry[key]);
            newEntry[key] = isNaN(numValue) || newEntry[key] === '' ? null : numValue;
        }
        return newEntry;
      }).filter(entry => entry.year && entry.month); // Filter out entries without year/month

      const { owners, financials, income, rent, utilities, supply, incomePeriod, ...restOfData } = formData;
      
      // Prepare financials based on the selected mode
      let finalFinancials = [];
      if (formData.financialsMode === 'MonthlyMultiple') {
        finalFinancials = cleanedFinancials; // cleanedFinancials is not defined here, let's fix this. It's defined in the original logic but was removed in my previous change. I'll re-add it.
      } else {
        // For Annual/Monthly, just take the first entry and clean it.
        const singleEntry = { ...formData.financials[0] };
        for (const key of ['income', 'rent', 'utilities', 'supply', 'year']) {
            const numValue = Number(singleEntry[key]);
            singleEntry[key] = isNaN(numValue) || singleEntry[key] === '' ? null : numValue;
        }
        finalFinancials = [singleEntry];
      }

      // Clean and convert financial entries for MonthlyMultiple
      const finalCleanedFinancials = formData.financials.map(entry => {
        const newEntry = { ...entry };
        for (const key of ['income', 'rent', 'utilities', 'supply', 'year']) {
            const numValue = Number(newEntry[key]);
            newEntry[key] = isNaN(numValue) || newEntry[key] === '' ? null : numValue;
        }
        return newEntry;
      }).filter(entry => formData.financialsMode !== 'MonthlyMultiple' || (entry.year && entry.month)); // Filter out entries without year/month only for multi-month


      const dataToSave = {
        ...restOfData,
        owners: cleanedOwners,
        financials: finalCleanedFinancials,
        yearEstablished: Number(formData.yearEstablished) || null,
        askingPrice: Number(formData.askingPrice) || null,
        financialsMode: formData.financialsMode,
        laborExpenseType: formData.laborExpenseType,
        laborExpenseValue: Number(formData.laborExpenseValue) || null,
        capex: Number(formData.capex) || null,
        // Nail Salon Valuation Fields
        locationType: formData.locationType,
        processorFee: Number(formData.processorFee) || null,
        commission: Number(formData.commission) || null,
        incomeValuationRate: Number(formData.incomeValuationRate) || null,
      };

      // Handle image uploads and deletions
      const uploadedImageUrls = [];
      const businessId = businessToEdit ? businessToEdit.id : doc(collection(db, 'businesses')).id;

      for (const slot of imageSlots) {
        if (slot) {
          if (slot.file) { // New file to upload
            const imageRef = ref(storage, `businesses/${businessId}/${Date.now()}_${slot.file.name}`);
            await uploadBytes(imageRef, slot.file);
            const downloadURL = await getDownloadURL(imageRef);
            uploadedImageUrls.push(downloadURL);
          } else if (slot.url) { // Existing file to keep
            uploadedImageUrls.push(slot.url);
          }
        }
      }
      dataToSave.imageUrls = uploadedImageUrls;

      // Delete images marked for deletion
      for (const urlToDelete of imagesToDelete) {
        try {
          const imageRef = ref(storage, urlToDelete);
          await deleteObject(imageRef);
        } catch (deleteError) {
          console.warn("Could not delete image, it may have already been removed:", deleteError.message);
        }
      }

      if (businessToEdit) {
        const businessRef = doc(db, "businesses", businessToEdit.id);
        // Don't update createdAt or the document's own id on edit
        const { createdAt, id, ...updateData } = dataToSave;
        await updateDoc(businessRef, { ...updateData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(doc(db, 'businesses', businessId), { ...dataToSave, createdAt: new Date() });
      }
      onSaved();
      setFormData(initialFormData); // Reset form
    } catch (error) {
      alert("Error saving profile: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginTop: 0, color: 'var(--accent-cyan)' }}>
        {businessToEdit ? '// EDIT BUSINESS PROFILE' : '// NEW DATA ENTRY'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Business Name</label><input className="modern-input" name="businessName" value={formData.businessName} required onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">LLC Official Name</label><input className="modern-input" name="llcName" value={formData.llcName} required onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Business Type</label>
                <select className="modern-input" name="businessType" value={formData.businessType} onChange={handleChange}>
                    <option>Nail Salon</option>
                    <option>Laundromat</option>
                    <option>Car Wash</option>
                </select>
            </div>
            <div className="input-group"><label className="input-label">Status</label>
                <select className="modern-input" name="status" value={formData.status} onChange={handleChange}>
                    <option>New Built</option><option>Existing / Old</option>
                </select>
            </div>
            <div className="input-group"><label className="input-label">Year Est.</label><input className="modern-input" type="number" name="yearEstablished" value={formData.yearEstablished} onChange={handleChange} /></div>
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        {formData.owners.map((owner, ownerIndex) => (
          <div key={ownerIndex} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '20px', position: 'relative' }}>
            {formData.owners.length > 1 && (
              <XCircle color="#f87171" size={20} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => removeOwner(ownerIndex)} />
            )}
            <h3 style={{marginTop: 0, marginBottom: '15px', color: 'var(--accent-blue)'}}>Owner {ownerIndex + 1}</h3>
            <div className="input-group">
              <label className="input-label">Owner Name</label>
              <input className="modern-input" name="name" value={owner.name} required onChange={(e) => handleOwnerChange(ownerIndex, e)} />
            </div>
            <div className="input-group">
              <label className="input-label">Phone #</label>
              {owner.phones.map((phone, phoneIndex) => (
                <div key={phoneIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <input className="modern-input" type="tel" value={phone} onChange={(e) => handlePhoneChange(ownerIndex, phoneIndex, e)} style={{ flexGrow: 1 }} />
                  {owner.phones.length > 1 && (
                    <XCircle color="#f87171" size={20} style={{ marginLeft: '10px', cursor: 'pointer' }} onClick={() => removePhone(ownerIndex, phoneIndex)} />
                  )}
                  {phoneIndex === owner.phones.length - 1 && (
                    <PlusCircle color="var(--accent-cyan)" size={20} style={{ marginLeft: '10px', cursor: 'pointer' }} onClick={() => addPhone(ownerIndex)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={addOwner} className="btn-modern-subtle" style={{ marginBottom: '20px' }}>
          <PlusCircle size={16} /> Add Another Owner
        </button>

        <div className="input-group"><label className="input-label">Business Address</label><input className="modern-input" name="businessAddress" value={formData.businessAddress} required onChange={handleChange} placeholder="Physical location..." /></div>
        <div className="input-group"><label className="input-label">Owner Private Address</label><input className="modern-input" name="ownerAddress" value={formData.ownerAddress} onChange={handleChange} placeholder="Primary owner's private residence..." /></div>

        {formData.businessType === 'Nail Salon' && (
          <>
            <h3 style={{ color: 'var(--accent-green)' }}>// NAIL SALON VALUATION INPUTS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="input-group">
                    <label className="input-label">Location Type</label>
                    <select className="modern-input" name="locationType" value={formData.locationType} onChange={handleChange}>
                        <option>Big plaza, anchor tenant</option>
                        <option>Small plaza, central</option>
                        <option>Standalone building, high traffic</option>
                        <option>Strip mall, no anchor</option>
                        <option>Lifestyle center/outdoor mall</option>
                    </select>
                </div>
                <div className="input-group"><label className="input-label">Processor Fee (%)</label><input className="modern-input" type="number" name="processorFee" value={formData.processorFee} onChange={handleChange} /></div>
                <div className="input-group"><label className="input-label">Commission (%)</label><input className="modern-input" type="number" name="commission" value={formData.commission} onChange={handleChange} /></div>
                <div className="input-group"><label className="input-label">Square Footage</label><input className="modern-input" type="number" name="squareFootage" value={formData.squareFootage} onChange={handleChange} /></div>
                <div className="input-group"><label className="input-label">Income Valuation Rate (%)</label><input className="modern-input" type="number" name="incomeValuationRate" value={formData.incomeValuationRate} onChange={handleChange} /></div>
            </div>
            <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />
          </>
        )}

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        <div className="input-group" style={{marginBottom: '20px'}}>
            <label className="input-label">Financial Entry Mode</label>
            <select className="modern-input" name="financialsMode" value={formData.financialsMode} onChange={handleChange}>
                <option value="MonthlyMultiple">Multiple Monthly Entries</option>
                <option value="Monthly">Single Monthly Entry (Typical Month)</option>
                <option value="Annual">Single Annual Entry</option>
            </select>
        </div>

        {formData.financialsMode === 'MonthlyMultiple' ? (
          <>
            <h3 style={{ color: 'var(--accent-green)' }}>// FINANCIAL ENTRIES</h3>
            {formData.financials.map((entry, index) => (
              <div key={index} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '20px', position: 'relative' }}>
                {formData.financials.length > 1 && (
                  <XCircle color="#f87171" size={20} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => removeFinancialEntry(index)} />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                  <div className="input-group">
                    <label className="input-label">Year</label>
                    <input className="modern-input" type="number" name="year" value={entry.year} onChange={(e) => handleFinancialsChange(index, e)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Month</label>
                    <select className="modern-input" name="month" value={entry.month} onChange={(e) => handleFinancialsChange(index, e)}>
                      {months.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                  <div className="input-group"><label className="input-label" style={{color: 'var(--accent-green)'}}>Income ($)</label><input className="modern-input" type="number" name="income" value={entry.income} onChange={(e) => handleFinancialsChange(index, e)} /></div>
                  <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Rent ($)</label><input className="modern-input" type="number" name="rent" value={entry.rent} onChange={(e) => handleFinancialsChange(index, e)} /></div>
                  <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Utilities ($)</label><input className="modern-input" type="number" name="utilities" value={entry.utilities} onChange={(e) => handleFinancialsChange(index, e)} /></div>
                  <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Supplies ($)</label><input className="modern-input" type="number" name="supply" value={entry.supply} onChange={(e) => handleFinancialsChange(index, e)} /></div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addFinancialEntry} className="btn-modern-subtle" style={{ marginBottom: '20px' }}>
              <PlusCircle size={16} /> Add Financial Entry
            </button>
          </>
        ) : (
          <div className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--accent-green)' }}>// {formData.financialsMode === 'Annual' ? 'ANNUAL' : 'TYPICAL MONTHLY'} FINANCIALS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div className="input-group"><label className="input-label" style={{color: 'var(--accent-green)'}}>Income ($)</label><input className="modern-input" type="number" name="income" value={formData.financials[0].income} onChange={(e) => handleFinancialsChange(0, e)} /></div>
              <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Rent ($)</label><input className="modern-input" type="number" name="rent" value={formData.financials[0].rent} onChange={(e) => handleFinancialsChange(0, e)} /></div>
              <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Utilities ($)</label><input className="modern-input" type="number" name="utilities" value={formData.financials[0].utilities} onChange={(e) => handleFinancialsChange(0, e)} /></div>
              <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Supplies ($)</label><input className="modern-input" type="number" name="supply" value={formData.financials[0].supply} onChange={(e) => handleFinancialsChange(0, e)} /></div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div className="input-group">
              <label className="input-label" style={{color: 'var(--accent-red)'}}>Labor Expense</label>
              <select className="modern-input" name="laborExpenseType" value={formData.laborExpenseType} onChange={handleChange}>
                  <option value="Percent">Percent of Income (%)</option>
                  <option value="Fixed">Fixed Amount ($)</option>
              </select>
          </div>
          <div className="input-group">
              <label className="input-label">&nbsp;</label>
              <input className="modern-input" type="number" name="laborExpenseValue" value={formData.laborExpenseValue} onChange={handleChange} />
          </div>
        </div>

        <div className="input-group" style={{marginBottom: '20px'}}>
            <label className="input-label" style={{color: 'var(--accent-blue)'}}>Asking Price ($)</label>
            <input className="modern-input" type="number" name="askingPrice" value={formData.askingPrice} onChange={handleChange} />
        </div>

        <div className="input-group" style={{marginBottom: '20px'}}>
            <label className="input-label" style={{color: 'var(--accent-blue)'}}>CapEx / Remodel Cost ($)</label>
            <input className="modern-input" type="number" name="capex" value={formData.capex} onChange={handleChange} placeholder="Optional one-time expense..." />
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        <h3 style={{ color: 'var(--accent-purple)' }}>// IMAGES (UP TO 8)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          {imageSlots.map((slot, index) => (
            <div key={index} className="image-slot">
              {slot ? (
                <>
                  <img src={slot.url} alt={`Upload preview ${index + 1}`} />
                  <button type="button" className="remove-image-btn" onClick={() => removeImage(index)}>
                    <XCircle size={20} />
                  </button>
                </>
              ) : (
                <label className="upload-label">
                  <ImagePlus size={30} />
                  <span>Add Image</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleImageChange(index, e)} />
                </label>
              )}
            </div>
          ))}
        </div>

        <button type="submit" className="btn-modern" disabled={loading} style={{width: '100%', marginTop: '20px', fontSize: '1.1rem'}}>
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {businessToEdit ? 'UPDATE' : 'UPLOAD TO'} DATABASE</>}
        </button>
      </form>
    </div>
  );
}