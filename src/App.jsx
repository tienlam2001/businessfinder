// src/App.jsx
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Plus, Building2, Activity, User, Briefcase, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Import for animation
import BusinessProfile from './components/BusinessProfile';
import AddBusinessForm from './components/AddBusinessForm';
import PersonProfile from './components/PersonProfile'; // Assuming this is correct
import AddPersonForm from './components/AddPersonForm'; // Corrected path
import AddResidenceForm from './components/AddResidenceForm';
import ResidenceProfile from './components/ResidenceProfile';
import './App.css';

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [businessToEdit, setBusinessToEdit] = useState(null);
  const [viewMode, setViewMode] = useState('business'); // 'business' or 'person'
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personToEdit, setPersonToEdit] = useState(null);
  const [residences, setResidences] = useState([]);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [residenceToEdit, setResidenceToEdit] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "businesses"), orderBy("businessName"));
    const unsubscribe = onSnapshot(q, (snapshot) => { // This was the start of the tangled useEffects
      setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "persons"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "residences"), orderBy("propertyAddress"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResidences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteBusiness = async (businessId) => {
    if (window.confirm("Are you sure you want to delete this business profile? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "businesses", businessId));
        // If the deleted business was the selected one, clear the selection.
        if (selectedBusiness?.id === businessId) {
          setSelectedBusiness(null);
          setBusinessToEdit(null);
        }
      } catch (error) {
        alert("Error deleting profile: " + error.message);
      }
    }
  };

  const handleDeletePerson = async (personId) => {
    if (window.confirm("Are you sure you want to delete this personal profile? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "persons", personId));
        if (selectedPerson?.id === personId) {
          setSelectedPerson(null);
          setPersonToEdit(null);
        }
      } catch (error) {
        alert("Error deleting profile: " + error.message);
      }
    }
  };

  const handleDeleteResidence = async (residenceId) => {
    if (window.confirm("Are you sure you want to delete this residence profile? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "residences", residenceId));
        if (selectedResidence?.id === residenceId) {
          setSelectedResidence(null);
          setResidenceToEdit(null);
        }
      } catch (error) {
        alert("Error deleting profile: " + error.message);
      }
    }
  };

  const handleEditBusiness = (business) => {
    setBusinessToEdit(business);
    setSelectedBusiness(null);
    setShowAddForm(true);
    setViewMode('business');
  };

  const handleEditPerson = (person) => {
    setPersonToEdit(person);
    setSelectedPerson(null);
    setShowAddForm(true);
  };

  const handleEditResidence = (residence) => {
    setResidenceToEdit(residence);
    setSelectedResidence(null);
    setShowAddForm(true);
    setViewMode('residence');
  };

  const handleAddNew = () => {
    setBusinessToEdit(null);
    setPersonToEdit(null);
    setResidenceToEdit(null);
    setSelectedBusiness(null);
    setSelectedPerson(null);
    setSelectedResidence(null);
    setShowAddForm(true);
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
           <Activity color="var(--accent-cyan)" size={40} />
           <h1 className="app-title">NEXUS RESEARCH</h1>
        </div>
        <div className="view-switcher">
          <button onClick={() => setViewMode('business')} className={viewMode === 'business' ? 'active' : ''}>
            <Briefcase size={16} /> Business Profiles
          </button>
          <button onClick={() => setViewMode('person')} className={viewMode === 'person' ? 'active' : ''}>
            <User size={16} /> Personal Profiles
          </button>
          <button onClick={() => setViewMode('residence')} className={viewMode === 'residence' ? 'active' : ''}>
            <Home size={16} /> Real Estate
          </button>
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
          <button className="btn-modern" onClick={handleAddNew} style={{ width: '100%', marginBottom: '2rem' }}>
            <Plus size={18}/> Initialize New Profile
          </button>
          
          <div className="list">
            {viewMode === 'business' ? (
              businesses.map(bus => (
                <div 
                  key={bus.id} 
                  className={`business-item ${(selectedBusiness?.id === bus.id && !showAddForm) ? 'active' : ''}`}
                  onClick={() => { setSelectedBusiness(bus); setShowAddForm(false); setSelectedPerson(null); }}
                >
                  <strong style={{color: 'var(--text-primary)'}}>{bus.businessName}</strong><br/>
                  <small style={{color: 'var(--text-secondary)'}}>{bus.llcName}</small>
                </div>
              ))
            ) : (
              viewMode === 'person' ? (
                persons.map(p => (
                  <div 
                    key={p.id} 
                    className={`business-item ${(selectedPerson?.id === p.id && !showAddForm) ? 'active' : ''}`}
                    onClick={() => { setSelectedPerson(p); setShowAddForm(false); setSelectedBusiness(null); setSelectedResidence(null); }}
                  >
                    <strong style={{color: 'var(--text-primary)'}}>{p.name}</strong><br/>
                    <small style={{color: 'var(--text-secondary)'}}>{p.homeAddress}</small>
                  </div>
                ))
              ) : (
                residences.map(r => (
                  <div
                    key={r.id}
                    className={`business-item ${(selectedResidence?.id === r.id && !showAddForm) ? 'active' : ''}`}
                    onClick={() => { setSelectedResidence(r); setShowAddForm(false); setSelectedBusiness(null); setSelectedPerson(null); }}>
                    <strong style={{color: 'var(--text-primary)'}}>{r.propertyAddress}</strong><br/>
                    <small style={{color: 'var(--text-secondary)'}}>{r.ownerName}</small>
                  </div>
                )))
            )}
          </div>
        </motion.div>

        {/* Main Content Area with Page Transitions */}
        <div className="main-content">
          <AnimatePresence mode='wait'>
            {showAddForm ? (
               <motion.div key="add-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  {viewMode === 'business' ? (
                    <AddBusinessForm onSaved={() => { setShowAddForm(false); setBusinessToEdit(null); }} businessToEdit={businessToEdit} />
                  ) : viewMode === 'person' ? (
                    <AddPersonForm onSaved={() => { setShowAddForm(false); setPersonToEdit(null); }} personToEdit={personToEdit} />
                  ) : (
                    <AddResidenceForm onSaved={() => { setShowAddForm(false); setResidenceToEdit(null); }} residenceToEdit={residenceToEdit} />
                  )}
               </motion.div>
            ) : selectedBusiness ? (
               <motion.div key={selectedBusiness.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <BusinessProfile data={selectedBusiness} onDelete={handleDeleteBusiness} onEdit={() => handleEditBusiness(selectedBusiness)} />
               </motion.div>
            ) : selectedPerson ? (
               <motion.div key={selectedPerson.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <PersonProfile data={selectedPerson} onDelete={handleDeletePerson} onEdit={() => handleEditPerson(selectedPerson)} />
               </motion.div>
            ) : selectedResidence ? (
               <motion.div key={selectedResidence.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <ResidenceProfile data={selectedResidence} onDelete={handleDeleteResidence} onEdit={() => handleEditResidence(selectedResidence)} />
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