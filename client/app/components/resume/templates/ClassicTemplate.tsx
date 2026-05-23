import React, { forwardRef } from 'react';
import type { TailoredResumeData } from '~/types/resume';

// Classic Professional — dark header block, serif feel, traditional layout
export const ClassicTemplate = forwardRef<HTMLDivElement, { data: Partial<TailoredResumeData> }>(
  ({ data }, ref) => {
    const headerBg = '#1e3a5f';
    const subColor = '#2563eb';

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: '10.5pt',
          color: '#1a1a1a',
          lineHeight: 1.6,
          boxSizing: 'border-box',
          background: '#fff',
        }}
      >
        {/* Full-width header */}
        <div style={{ background: headerBg, color: '#fff', padding: '28px 44px 22px' }}>
          <h1 style={{ fontSize: '24pt', fontWeight: 700, margin: 0, letterSpacing: '0.5px', color: '#fff' }}>
            {data.name || ''}
          </h1>
          <div style={{ marginTop: '8px', fontSize: '9pt', color: '#a8c4e0', display: 'flex', flexWrap: 'wrap', gap: '0 20px' }}>
            {data.contact?.email && <span>{data.contact.email}</span>}
            {data.contact?.phone && <span>{data.contact.phone}</span>}
            {data.contact?.location && <span>{data.contact.location}</span>}
            {data.contact?.linkedin && <span>{data.contact.linkedin}</span>}
            {data.contact?.github && <span>{data.contact.github}</span>}
            {data.contact?.portfolio && <span>{data.contact.portfolio}</span>}
          </div>
        </div>

        <div style={{ padding: '24px 44px' }}>
          {/* Summary */}
          {data.summary && (
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 700, color: subColor, borderBottom: `2px solid ${subColor}`, paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Professional Summary
              </h2>
              <p style={{ margin: 0, color: '#333', lineHeight: 1.65 }}>{data.summary}</p>
            </div>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 700, color: subColor, borderBottom: `2px solid ${subColor}`, paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Core Competencies
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {data.skills.map((skill, i) => (
                  <span key={i} style={{
                    background: '#f0f4ff',
                    color: subColor,
                    border: `1px solid #c7d7f9`,
                    borderRadius: '3px',
                    padding: '2px 9px',
                    fontSize: '9pt',
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 700, color: subColor, borderBottom: `2px solid ${subColor}`, paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Professional Experience
              </h2>
              {data.experience.map((job, i) => (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: '11pt', color: '#1a1a2e' }}>{job.title}</span>
                    {job.dates && <span style={{ fontSize: '9pt', color: '#555', fontStyle: 'italic' }}>{job.dates}</span>}
                  </div>
                  {job.company && <div style={{ fontSize: '10pt', color: headerBg, fontStyle: 'italic', marginBottom: '4px' }}>{job.company}</div>}
                  {job.bullets && job.bullets.length > 0 && (
                    <ul style={{ marginTop: '4px', paddingLeft: '20px', marginBottom: 0 }}>
                      {job.bullets.map((bullet, j) => (
                        <li key={j} style={{ marginBottom: '3px', color: '#333' }}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 700, color: subColor, borderBottom: `2px solid ${subColor}`, paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Education
              </h2>
              {data.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '10.5pt' }}>{edu.degree}</span>
                    {edu.dates && <span style={{ fontSize: '9pt', color: '#555', fontStyle: 'italic' }}>{edu.dates}</span>}
                  </div>
                  {edu.institution && <div style={{ color: headerBg, fontStyle: 'italic', fontSize: '10pt' }}>{edu.institution}</div>}
                  {edu.details && <p style={{ fontSize: '9pt', color: '#666', marginTop: '2px', marginBottom: 0 }}>{edu.details}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 700, color: subColor, borderBottom: `2px solid ${subColor}`, paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Certifications
              </h2>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {data.certifications.map((cert, i) => (
                  <li key={i} style={{ marginBottom: '3px', color: '#333' }}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
);
ClassicTemplate.displayName = 'ClassicTemplate';
