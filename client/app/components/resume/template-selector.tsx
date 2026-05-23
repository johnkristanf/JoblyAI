import React from 'react';
import type { TemplateId } from '~/types/resume';

interface TemplateSelectorProps {
  value: TemplateId;
  onChange: (t: TemplateId) => void;
  layout?: 'horizontal' | 'vertical';
}

const TEMPLATES: { id: TemplateId; label: string; description: string; preview: React.ReactNode }[] = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Indigo accents · Sans-serif · Clean',
    preview: (
      <div style={{ width: '100%', height: '100%', background: '#fff', padding: '8px', fontFamily: 'sans-serif', fontSize: '5px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '8px', borderBottom: '1.5px solid #4f46e5', paddingBottom: '3px', marginBottom: '4px' }}>JOHN DOE</div>
        <div style={{ color: '#888', fontSize: '4px', marginBottom: '4px' }}>email · phone · location</div>
        <div style={{ borderLeft: '2px solid #4f46e5', paddingLeft: '4px', marginBottom: '4px' }}>
          <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '4.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Summary</div>
          <div style={{ background: '#e5e5e5', height: '3px', borderRadius: '1px', marginBottom: '1px' }} />
          <div style={{ background: '#e5e5e5', height: '3px', borderRadius: '1px', width: '80%' }} />
        </div>
        <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {['React', 'Python', 'AWS'].map(s => (
            <span key={s} style={{ background: '#ede9fe', color: '#4f46e5', borderRadius: '2px', padding: '1px 3px', fontSize: '4px' }}>{s}</span>
          ))}
        </div>
        <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '4.5px', textTransform: 'uppercase', borderBottom: '1px solid #ede9fe', paddingBottom: '1px', marginBottom: '3px' }}>Experience</div>
        <div style={{ background: '#e5e5e5', height: '3px', borderRadius: '1px', marginBottom: '1px' }} />
        <div style={{ background: '#e5e5e5', height: '3px', borderRadius: '1px', width: '70%' }} />
      </div>
    )
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Navy header · Serif · Traditional',
    preview: (
      <div style={{ width: '100%', height: '100%', fontFamily: 'Georgia, serif', fontSize: '5px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ background: '#1e3a5f', padding: '8px', color: '#fff', marginBottom: '6px' }}>
          <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '2px' }}>JOHN DOE</div>
          <div style={{ color: '#a8c4e0', fontSize: '4px' }}>email · phone · location</div>
        </div>
        <div style={{ padding: '0 8px' }}>
          <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '5px', borderBottom: '1.5px solid #2563eb', paddingBottom: '1px', marginBottom: '3px', textTransform: 'uppercase' }}>Professional Summary</div>
          <div style={{ background: '#e5e5e5', height: '2.5px', borderRadius: '1px', marginBottom: '1px' }} />
          <div style={{ background: '#e5e5e5', height: '2.5px', borderRadius: '1px', width: '75%', marginBottom: '3px' }} />
          <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '5px', borderBottom: '1.5px solid #2563eb', paddingBottom: '1px', marginBottom: '3px', textTransform: 'uppercase' }}>Experience</div>
          <div style={{ background: '#e5e5e5', height: '2.5px', borderRadius: '1px', marginBottom: '1px' }} />
          <div style={{ background: '#e5e5e5', height: '2.5px', borderRadius: '1px', width: '60%' }} />
        </div>
      </div>
    )
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Dark navy · Gold accents · High-contrast',
    preview: (
      <div style={{ width: '100%', height: '100%', fontFamily: 'sans-serif', fontSize: '5px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ background: '#0f172a', padding: '8px', marginBottom: '6px' }}>
          <div style={{ fontWeight: 800, fontSize: '9px', color: '#fff', marginBottom: '3px' }}>JOHN DOE</div>
          <div style={{ width: '18px', height: '2px', background: '#f59e0b', borderRadius: '1px', marginBottom: '2px' }} />
          <div style={{ color: '#94a3b8', fontSize: '4px' }}>email · phone · location</div>
        </div>
        <div style={{ padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
            <span style={{ fontWeight: 800, fontSize: '5px', textTransform: 'uppercase', color: '#0f172a' }}>Skills</span>
            <div style={{ flex: 1, height: '1.5px', background: '#f59e0b' }} />
          </div>
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginBottom: '3px' }}>
            {['React', 'Python', 'AWS'].map(s => (
              <span key={s} style={{ background: '#0f172a', color: '#fff', borderRadius: '1px', padding: '1px 3px', fontSize: '4px' }}>{s}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
            <span style={{ fontWeight: 800, fontSize: '5px', textTransform: 'uppercase', color: '#0f172a' }}>Experience</span>
            <div style={{ flex: 1, height: '1.5px', background: '#f59e0b' }} />
          </div>
          <div style={{ borderLeft: '1.5px solid #f59e0b', paddingLeft: '3px' }}>
            <div style={{ background: '#e5e5e5', height: '2.5px', borderRadius: '1px', marginBottom: '1px' }} />
            <div style={{ background: '#e5e5e5', height: '2.5px', borderRadius: '1px', width: '65%' }} />
          </div>
        </div>
      </div>
    )
  },
];

export function TemplateSelector({ value, onChange, layout = 'horizontal' }: TemplateSelectorProps) {
  return (
    <div className={`flex flex-col gap-2 w-full ${layout === 'vertical' ? 'h-full' : ''}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Choose Template</p>
      <div className={`flex gap-3 ${layout === 'vertical' ? 'flex-col overflow-y-auto pr-2' : ''}`}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
              layout === 'horizontal' ? 'flex-1' : 'w-full shrink-0'
            } ${
              value === t.id
                ? 'border-blue-600 shadow-md shadow-blue-100'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Mini preview */}
            <div className="w-full aspect-3/4 bg-white overflow-hidden pointer-events-none">
              {t.preview}
            </div>
            <div className="pb-2 px-1 text-center pointer-events-none">
              <div className={`text-xs font-bold ${value === t.id ? 'text-blue-600' : 'text-gray-700'}`}>
                {t.label}
              </div>
              <div className="text-[9px] text-gray-400 leading-tight">{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
