import React, { forwardRef } from 'react';
import type { TailoredResumeData } from '~/types/resume';

// Bold Impact — dark navy header, high-contrast chips, sharp dividers
export const BoldTemplate = forwardRef<HTMLDivElement, { data: Partial<TailoredResumeData> }>(
  ({ data }, ref) => {
    const navy = '#0f172a';
    const gold = '#f59e0b';
    const lightGold = '#fef3c7';

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          fontFamily: "'Inter', Arial, sans-serif",
          fontSize: '10.5pt',
          color: '#0f172a',
          lineHeight: 1.55,
          boxSizing: 'border-box',
          background: '#fff',
        }}
      >
        {/* Bold header */}
        <div style={{ background: navy, padding: '30px 44px 24px' }}>
          <h1 style={{ fontSize: '25pt', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            {data.name || ''}
          </h1>
          <div style={{ width: '48px', height: '4px', background: gold, borderRadius: '2px', margin: '10px 0 12px' }} />
          <div style={{ fontSize: '9pt', color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: '0 20px' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '10.5pt', textTransform: 'uppercase', letterSpacing: '1.5px', color: navy }}>Profile</div>
                <div style={{ flex: 1, height: '2px', background: gold }} />
              </div>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.65 }}>{data.summary}</p>
            </div>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '10.5pt', textTransform: 'uppercase', letterSpacing: '1.5px', color: navy }}>Skills</div>
                <div style={{ flex: 1, height: '2px', background: gold }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {data.skills.map((skill, i) => (
                  <span key={i} style={{
                    background: navy,
                    color: '#fff',
                    borderRadius: '3px',
                    padding: '3px 10px',
                    fontSize: '9pt',
                    fontWeight: 600,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '10.5pt', textTransform: 'uppercase', letterSpacing: '1.5px', color: navy }}>Experience</div>
                <div style={{ flex: 1, height: '2px', background: gold }} />
              </div>
              {data.experience.map((job, i) => (
                <div key={i} style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: `3px solid ${gold}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: '11pt', color: navy }}>{job.title}</span>
                    {job.dates && (
                      <span style={{ fontSize: '8.5pt', background: lightGold, color: '#92400e', borderRadius: '3px', padding: '1px 7px', fontWeight: 600 }}>
                        {job.dates}
                      </span>
                    )}
                  </div>
                  {job.company && <div style={{ fontSize: '9.5pt', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>{job.company}</div>}
                  {job.bullets && job.bullets.length > 0 && (
                    <ul style={{ marginTop: '4px', paddingLeft: '18px', marginBottom: 0 }}>
                      {job.bullets.map((bullet, j) => (
                        <li key={j} style={{ marginBottom: '3px', color: '#334155' }}>{bullet}</li>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '10.5pt', textTransform: 'uppercase', letterSpacing: '1.5px', color: navy }}>Education</div>
                <div style={{ flex: 1, height: '2px', background: gold }} />
              </div>
              {data.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '10px', paddingLeft: '12px', borderLeft: `3px solid ${gold}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '10.5pt' }}>{edu.degree}</span>
                    {edu.dates && <span style={{ fontSize: '8.5pt', color: '#64748b' }}>{edu.dates}</span>}
                  </div>
                  {edu.institution && <div style={{ color: '#64748b', fontSize: '9.5pt' }}>{edu.institution}</div>}
                  {edu.details && <p style={{ fontSize: '9pt', color: '#64748b', marginTop: '2px', marginBottom: 0 }}>{edu.details}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '10.5pt', textTransform: 'uppercase', letterSpacing: '1.5px', color: navy }}>Certifications</div>
                <div style={{ flex: 1, height: '2px', background: gold }} />
              </div>
              <ul style={{ paddingLeft: '18px', margin: 0 }}>
                {data.certifications.map((cert, i) => (
                  <li key={i} style={{ marginBottom: '3px', color: '#334155' }}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
);
BoldTemplate.displayName = 'BoldTemplate';
