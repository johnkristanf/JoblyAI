import React, { forwardRef } from 'react';
import type { TailoredResumeData, TemplateId } from '~/types/resume';
import { ModernTemplate } from './templates/ModernTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { BoldTemplate } from './templates/BoldTemplate';

interface ResumePreviewProps {
  data: Partial<TailoredResumeData>;
  template?: TemplateId;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data, template = 'modern' }, ref) => {
    if (!data) return null;

    const TemplateComponent = {
      modern: ModernTemplate,
      classic: ClassicTemplate,
      bold: BoldTemplate,
    }[template];

    return (
      <div className="bg-gray-100 p-8 min-h-full overflow-x-auto">
        <div className="mx-auto shadow-xl shrink-0 w-fit">
          <TemplateComponent data={data} ref={ref} />
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = 'ResumePreview';
