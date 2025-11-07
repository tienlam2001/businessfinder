// src/components/PersonProfile.jsx
import React from 'react';
import { Printer, Trash2, Edit, User, Home, Phone, Briefcase, Link, Users } from 'lucide-react';

const DetailSection = ({ icon, title, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', marginTop: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
      {icon} {title}
    </h3>
    <div style={{ paddingLeft: '34px', opacity: 0.9 }}>{children}</div>
  </div>
);

const ListItems = ({ items }) => (
  items && items.length > 0 ? (
    <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
  ) : <p>N/A</p>
);

export default function PersonProfile({ data, onDelete, onEdit }) {
  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(to right, white, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {data.name}
          </h1>
          <span style={{ color: 'var(--accent-purple)', letterSpacing: '2px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
             // PERSONAL DOSSIER
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onEdit(data)} className="btn-modern" style={{ background: 'var(--accent-blue)' }}>
            <Edit size={20} /> EDIT
          </button>
          <button onClick={() => onDelete(data.id)} className="btn-modern" style={{ background: 'var(--accent-red)' }}>
            <Trash2 size={20} /> DELETE
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
        <DetailSection icon={<User size={18} />} title="Personal Info">
          <p><strong>Name:</strong> {data.name || 'N/A'}</p>
          <p><strong>Age:</strong> {data.age || 'N/A'}</p>
        </DetailSection>

        <DetailSection icon={<Home size={18} />} title="Home Address">
          <p>{data.homeAddress || 'N/A'}</p>
        </DetailSection>

        <DetailSection icon={<Phone size={18} />} title="Phone Numbers">
          <ListItems items={data.phones} />
        </DetailSection>

        <DetailSection icon={<Users size={18} />} title="Possible Partners">
          <ListItems items={data.partners} />
        </DetailSection>

        <DetailSection icon={<Briefcase size={18} />} title="Businesses / LLCs">
          <ListItems items={data.businesses} />
        </DetailSection>

        <DetailSection icon={<Home size={18} />} title="Other Properties">
          <ListItems items={data.properties} />
        </DetailSection>

        <DetailSection icon={<Link size={18} />} title="Social Media">
          {data.socials && data.socials.length > 0 ? (
            <ul>{data.socials.map((s, i) => <li key={i}><strong>{s.platform}:</strong> <a href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a></li>)}</ul>
          ) : <p>N/A</p>}
        </DetailSection>
      </div>
    </div>
  );
}