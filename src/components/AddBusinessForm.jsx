// src/components/AddBusinessForm.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Save, Loader2, PlusCircle, XCircle } from 'lucide-react';

const initialOwnerState = { name: '', phones: [''] };
const initialFormData = {
  businessName: '',
  llcName: '',
  status: 'New Built',
  yearEstablished: new Date().getFullYear(),
  owners: [initialOwnerState],
  businessAddress: '',
  ownerAddress: '', // This seems to be a primary owner's address
  income: '',
  rent: '',
  utilities: '',
  supply: ''
};

export default function AddBusinessForm({ onSaved, businessToEdit }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (businessToEdit) {
      // Ensure owners is an array and each owner has a phones array
      const owners = (businessToEdit.owners || [{ name: businessToEdit.ownerName || '', phones: [businessToEdit.ownerPhone || ''] }]).map(o => ({...o, phones: Array.isArray(o.phones) ? o.phones : [o.phones || '']}));
      
      // Ensure all fields from initialFormData are present, preventing 'undefined'.
      const sanitizedData = {
        ...initialFormData,
        ...businessToEdit,
        owners
      };

      // Explicitly set potentially missing numeric fields to empty strings.
      for (const key of ['income', 'rent', 'utilities', 'supply']) {
        sanitizedData[key] = sanitizedData[key] ?? '';
      }

      setFormData(sanitizedData);
    } else {
      setFormData(initialFormData);
    }
  }, [businessToEdit]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filter out empty phone numbers before saving
      const cleanedOwners = formData.owners.map(owner => ({
        ...owner,
        phones: owner.phones.filter(phone => phone.trim() !== '')
      }));

      const dataToSave = { ...formData, owners: cleanedOwners };

      // Convert numeric strings to numbers or null before saving
      for (const key of ['income', 'rent', 'utilities', 'supply']) {
        if (dataToSave[key] === '') {
          dataToSave[key] = null; // Store as null if empty
        } else {
          const numValue = Number(dataToSave[key]);
          if (isNaN(numValue)) {
            throw new Error(`Please enter a valid number for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
          }
          dataToSave[key] = numValue;
        }
      }

      if (businessToEdit) {
        const businessRef = doc(db, "businesses", businessToEdit.id);
        // Don't update createdAt on edit
        const { createdAt, ...updateData } = dataToSave;
        await updateDoc(businessRef, updateData);
      } else {
        await addDoc(collection(db, "businesses"), { ...dataToSave, createdAt: new Date() });
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Business Name</label><input className="modern-input" name="businessName" value={formData.businessName} required onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">LLC Official Name</label><input className="modern-input" name="llcName" value={formData.llcName} required onChange={handleChange} /></div>
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

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div className="input-group"><label className="input-label" style={{color: 'var(--accent-green)'}}>Income ($)</label><input className="modern-input" type="number" name="income" value={formData.income} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Rent ($)</label><input className="modern-input" type="number" name="rent" value={formData.rent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Utilities ($)</label><input className="modern-input" type="number" name="utilities" value={formData.utilities} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Supplies ($)</label><input className="modern-input" type="number" name="supply" value={formData.supply} onChange={handleChange} /></div>
        </div>

        <button type="submit" className="btn-modern" disabled={loading} style={{width: '100%', marginTop: '20px', fontSize: '1.1rem'}}>
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {businessToEdit ? 'UPDATE' : 'UPLOAD TO'} DATABASE</>}
        </button>
      </form>
    </div>
  );
}