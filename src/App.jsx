// src/App.jsx
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Plus, Building2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Import for animation
import BusinessProfile from './components/BusinessProfile';
import AddBusinessForm from './components/AddBusinessForm';
import './App.css';

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "businesses"), (snapshot) => {
      setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
           <Activity color="var(--accent-cyan)" size={40} />
           <h1 className="app-title">NEXUS RESEARCH</h1>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>v2.0</div>
      </header>

      <div className="main-container">
        {/* Sidebar with Animation */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="sidebar-glass"
        >
          <button className="btn-modern" onClick={() => { setShowAddForm(true); setSelectedBusiness(null); }} style={{ width: '100%', marginBottom: '2rem' }}>
            <Plus size={18}/> Initialize New Profile
          </button>
          
          <div className="list">
            {businesses.map(bus => (
              <div 
                key={bus.id} 
                className={`business-item ${selectedBusiness?.id === bus.id ? 'active' : ''}`}
                onClick={() => { setSelectedBusiness(bus); setShowAddForm(false); }}
              >
                <strong style={{color: 'var(--text-primary)'}}>{bus.businessName}</strong><br/>
                <small style={{color: 'var(--text-secondary)'}}>{bus.llcName}</small>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Content Area with Page Transitions */}
        <div className="main-content">
          <AnimatePresence mode='wait'>
            {showAddForm ? (
               <motion.div key="add-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <AddBusinessForm onSaved={() => setShowAddForm(false)} />
               </motion.div>
            ) : selectedBusiness ? (
               <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <BusinessProfile data={selectedBusiness} />
               </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '100px' }}
              >
                <Building2 size={80} opacity={0.2} />
                <h2>Awaiting Selection</h2>
                <p>Select a data node or initialize a new sequence.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;