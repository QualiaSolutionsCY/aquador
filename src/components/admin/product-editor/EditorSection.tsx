'use client';

/**
 * EditorSection — hairline-divider section wrapper for the Product Editor.
 *
 * No Card surface (admin tools favour functional density). Just a top
 * border, a section heading, optional caption, and the children below.
 */

import type { ReactNode } from 'react';

interface EditorSectionProps {
  title: string;
  caption?: string;
  children: ReactNode;
}

export function EditorSection({ title, caption, children }: EditorSectionProps) {
  return (
    <section className="border-t border-border pt-8">
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="font-display text-[20px] leading-tight text-fg">{title}</h2>
        {caption ? <p className="font-body text-[13px] text-fg-muted">{caption}</p> : null}
      </div>
      {children}
    </section>
  );
}
