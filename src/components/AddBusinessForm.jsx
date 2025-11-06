// src/components/AddBusinessForm.jsx
import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Save, Loader2 } from 'lucide-react';

export default function AddBusinessForm({ onSaved }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '', llcName: '', status: 'New Built', yearEstablished: new Date().getFullYear(),
    ownerName: '', ownerPhone: '', businessAddress: '', ownerAddress: '',
    income: '', rent: '', utilities: '', supply: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "businesses"), { ...formData, createdAt: new Date() });
      onSaved();
    } catch (error) {
      alert("Error saving profile: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginTop: 0, color: 'var(--accent-cyan)' }}>// NEW DATA ENTRY</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Business Name</label><input className="modern-input" name="businessName" required onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">LLC Official Name</label><input className="modern-input" name="llcName" required onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Status</label>
                <select className="modern-input" name="status" onChange={handleChange}>
                    <option>New Built</option><option>Existing / Old</option>
                </select>
            </div>
            <div className="input-group"><label className="input-label">Year Est.</label><input className="modern-input" type="number" name="yearEstablished" defaultValue={2023} onChange={handleChange} /></div>
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Owner Name</label><input className="modern-input" name="ownerName" required onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Phone #</label><input className="modern-input" name="ownerPhone" onChange={handleChange} /></div>
        </div>
        <div className="input-group"><label className="input-label">Business Address</label><input className="modern-input" name="businessAddress" required onChange={handleChange} placeholder="Physical location..." /></div>
        <div className="input-group"><label className="input-label">Owner Private Address</label><input className="modern-input" name="ownerAddress" onChange={handleChange} placeholder="Private residence..." /></div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div className="input-group"><label className="input-label" style={{color: 'var(--accent-green)'}}>Income ($)</label><input className="modern-input" type="number" name="income" onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Rent ($)</label><input className="modern-input" type="number" name="rent" onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Utilities ($)</label><input className="modern-input" type="number" name="utilities" onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label" style={{color: '#f87171'}}>Supplies ($)</label><input className="modern-input" type="number" name="supply" onChange={handleChange} /></div>
        </div>

        <button type="submit" className="btn-modern" disabled={loading} style={{width: '100%', marginTop: '20px', fontSize: '1.1rem'}}>
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> UPLOAD TO DATABASE</>}
        </button>
      </form>
    </div>
  );
}