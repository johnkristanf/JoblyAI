import React, { forwardRef } from 'react';
import type { TailoredResumeData } from '~/types/resume';

// Modern Minimalist — clean white with indigo left-border accents
export const ModernTemplate = forwardRef<HTMLDivElement, { data: Partial<TailoredResumeData> }>(
  ({ data }, ref) => {
    const accent = '#4f46e5';
    const accentLight = '#ede9fe';

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '36px 44px',
          fontFamily: "'Inter', Arial, sans-serif",
          fontSize: '10.5pt',
          color: '#1a1a2e',
          lineHeight: 1.55,
          boxSizing: 'border-box',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: `2.5px solid ${accent}`, paddingBottom: '12px', marginBottom: '18px' }}>
          <h1 style={{ fontSize: '22pt', fontWeight: 700, color: accent, letterSpacing: '-0.3px', margin: 0 }}>
            {data.name || ''}
          </h1>
          <div style={{ marginTop: '6px', fontSize: '9pt', color: '#555', display: 'flex', flexWrap: 'wrap', gap: '0 18px' }}>
            {data.contact?.email && <span>{data.contact.email}</span>}
            {data.contact?.phone && <span>{data.contact.phone}</span>}
            {data.contact?.location && <span>{data.contact.location}</span>}
            {data.contact?.linkedin && <span>{data.contact.linkedin}</span>}
            {data.contact?.github && <span>{data.contact.github}</span>}
            {data.contact?.portfolio && <span>{data.contact.portfolio}</span>}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div style={{ marginBottom: '16px', borderLeft: `3px solid ${accent}`, paddingLeft: '12px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: accent, marginBottom: '5px' }}>
              Professional Summary
            </div>
            <p style={{ color: '#333', margin: 0, fontSize: '10pt' }}>{data.summary}</p>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: accent, borderBottom: `1px solid ${accentLight}`, paddingBottom: '3px', marginBottom: '8px' }}>
              Skills
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {data.skills.map((skill, i) => (
                <span key={i} style={{ background: accentLight, color: accent, borderRadius: '4px', padding: '2px 8px', fontSize: '9pt', fontWeight: 500 }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: accent, borderBottom: `1px solid ${accentLight}`, paddingBottom: '3px', marginBottom: '8px' }}>
              Experience
            </div>
            {data.experience.map((job, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '10.5pt', color: '#1a1a2e' }}>{job.title}</span>
                    {job.company && <span style={{ fontSize: '9.5pt', color: '#555', fontStyle: 'italic' }}> · {job.company}</span>}
                  </div>
                  {job.dates && <span style={{ fontSize: '9pt', color: '#888', whiteSpace: 'nowrap' }}>{job.dates}</span>}
                </div>
                {job.bullets && job.bullets.length > 0 && (
                  <ul style={{ marginTop: '4px', paddingLeft: '18px', marginBottom: 0 }}>
                    {job.bullets.map((bullet, j) => (
                      <li key={j} style={{ marginBottom: '2px', color: '#333' }}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: accent, borderBottom: `1px solid ${accentLight}`, paddingBottom: '3px', marginBottom: '8px' }}>
              Education
            </div>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '10.5pt' }}>{edu.degree}</span>
                    {edu.institution && <span style={{ fontSize: '9.5pt', color: '#555', fontStyle: 'italic' }}> · {edu.institution}</span>}
                  </div>
                  {edu.dates && <span style={{ fontSize: '9pt', color: '#888' }}>{edu.dates}</span>}
                </div>
                {edu.details && <p style={{ fontSize: '9pt', color: '#666', marginTop: '2px', marginBottom: 0 }}>{edu.details}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: accent, borderBottom: `1px solid ${accentLight}`, paddingBottom: '3px', marginBottom: '8px' }}>
              Certifications
            </div>
            <ul style={{ paddingLeft: '18px', margin: 0 }}>
              {data.certifications.map((cert, i) => (
                <li key={i} style={{ marginBottom: '3px', color: '#333' }}>{cert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);
ModernTemplate.displayName = 'ModernTemplate';
