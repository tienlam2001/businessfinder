// src/components/AddPersonForm.jsx
import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Save, Loader2, PlusCircle, XCircle, ImagePlus } from 'lucide-react';
import { sanitizeFormValue } from '../utils/sanitizeFormData';

const createInitialState = () => ({
  name: '',
  age: '',
  homeAddress: '',
  phones: [''],
  properties: [''],
  businesses: [''],
  partners: [''],
  socials: [{ platform: 'Facebook', url: '' }],
  imageUrls: [],
});

export default function AddPersonForm({ onSaved, personToEdit }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(createInitialState());
  const [imageSlots, setImageSlots] = useState(Array(8).fill(null));
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    if (personToEdit) {
      setFormData(sanitizeFormValue({
        ...createInitialState(),
        ...personToEdit,
        phones: personToEdit.phones?.length ? personToEdit.phones : [''],
        properties: personToEdit.properties?.length ? personToEdit.properties : [''],
        businesses: personToEdit.businesses?.length ? personToEdit.businesses : [''],
        partners: personToEdit.partners?.length ? personToEdit.partners : [''],
        socials: personToEdit.socials?.length ? personToEdit.socials : [{ platform: 'Facebook', url: '' }],
      }));
      // Populate image slots
      const newImageSlots = Array(8).fill(null);
      if (personToEdit.imageUrls) {
        personToEdit.imageUrls.forEach((url, i) => {
          if (i < 8) newImageSlots[i] = { url, file: null };
        });
      }
      setImageSlots(newImageSlots);
    } else {
      setFormData(createInitialState());
      setImageSlots(Array(8).fill(null));
    }
    setImagesToDelete([]);
  }, [personToEdit, onSaved]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDynamicListChange = (listName, index, value) => {
    const newList = [...formData[listName]];
    newList[index] = value;
    setFormData({ ...formData, [listName]: newList });
  };

  const addDynamicListItem = (listName, initialValue) => {
    setFormData({ ...formData, [listName]: [...formData[listName], initialValue] });
  };

  const removeDynamicListItem = (listName, index) => {
    if (formData[listName].length > 1) {
      const newList = [...formData[listName]];
      newList.splice(index, 1);
      setFormData({ ...formData, [listName]: newList });
    }
  };

  const handleSocialChange = (index, field, value) => {
    const newSocials = [...formData.socials];
    newSocials[index][field] = value;
    setFormData({ ...formData, socials: newSocials });
  };

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
        age: Number(formData.age) || null,
        phones: formData.phones.filter(item => item.trim() !== ''),
        properties: formData.properties.filter(item => item.trim() !== ''),
        businesses: formData.businesses.filter(item => item.trim() !== ''),
        partners: formData.partners.filter(item => item.trim() !== ''),
        socials: formData.socials.filter(item => item.url.trim() !== ''),
      };

      // Handle image uploads and deletions
      const uploadedImageUrls = [];
      const personId = personToEdit ? personToEdit.id : doc(collection(db, 'persons')).id;

      for (const slot of imageSlots) {
        if (slot) {
          if (slot.file) { // New file to upload
            const imageRef = ref(storage, `persons/${personId}/${Date.now()}_${slot.file.name}`);
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

      if (personToEdit) {
        const personRef = doc(db, "persons", personToEdit.id);
        const { createdAt, id, ...updateData } = dataToSave;
        await updateDoc(personRef, { ...updateData, updatedAt: serverTimestamp() });
      } else {
        await setDoc(doc(db, "persons", personId), { ...dataToSave, createdAt: new Date() });
      }
      onSaved();
    } catch (error) {
      alert("Error saving profile: " + error.message);
    }
    setLoading(false);
  };

  const renderDynamicList = (listName, label) => (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {formData[listName].map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <input className="modern-input" value={item} onChange={(e) => handleDynamicListChange(listName, index, e.target.value)} style={{ flexGrow: 1 }} />
          {formData[listName].length > 1 && <XCircle color="#f87171" size={20} style={{ marginLeft: '10px', cursor: 'pointer' }} onClick={() => removeDynamicListItem(listName, index)} />}
          {index === formData[listName].length - 1 && <PlusCircle color="var(--accent-cyan)" size={20} style={{ marginLeft: '10px', cursor: 'pointer' }} onClick={() => addDynamicListItem(listName, '')} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="glass-card">
      <h2 style={{ marginTop: 0, color: 'var(--accent-cyan)' }}>
        {personToEdit ? '// EDIT PERSONAL PROFILE' : '// NEW PERSONAL PROFILE'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="input-group"><label className="input-label">Full Name</label><input className="modern-input" name="name" value={formData.name} required onChange={handleChange} /></div>
          <div className="input-group"><label className="input-label">Age</label><input className="modern-input" type="number" name="age" value={formData.age} onChange={handleChange} /></div>
        </div>
        <div className="input-group"><label className="input-label">Home Address</label><input className="modern-input" name="homeAddress" value={formData.homeAddress} onChange={handleChange} /></div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {renderDynamicList('phones', 'Phone Numbers')}
          {renderDynamicList('partners', 'Possible Partners')}
        </div>
        {renderDynamicList('properties', 'Properties (Addresses)')}
        {renderDynamicList('businesses', 'Businesses / LLCs (Names & Addresses)')}

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        <div className="input-group">
          <label className="input-label">Social Media</label>
          {formData.socials.map((social, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', gap: '10px' }}>
              <select className="modern-input" style={{flexBasis: '150px'}} value={social.platform} onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}>
                <option>Facebook</option><option>Twitter</option><option>LinkedIn</option><option>Instagram</option><option>Other</option>
              </select>
              <input className="modern-input" placeholder="URL or handle" value={social.url} onChange={(e) => handleSocialChange(index, 'url', e.target.value)} style={{ flexGrow: 1 }} />
              {formData.socials.length > 1 && <XCircle color="#f87171" size={20} style={{ cursor: 'pointer' }} onClick={() => removeDynamicListItem('socials', index)} />}
              {index === formData.socials.length - 1 && <PlusCircle color="var(--accent-cyan)" size={20} style={{ cursor: 'pointer' }} onClick={() => addDynamicListItem('socials', { platform: 'Facebook', url: '' })} />}
            </div>
          ))}
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

        <button type="submit" className="btn-modern" disabled={loading} style={{width: '100%', marginTop: '30px', fontSize: '1.1rem'}}>
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {personToEdit ? 'UPDATE' : 'SAVE'} PROFILE</>}
        </button>
      </form>
    </div>
  );
}
