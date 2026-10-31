'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '@/types';

interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (newPage: number) => void;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.total_pages <= 1) return null;

  const { page, total, page_size, total_pages } = meta;
  const startItem = (page - 1) * page_size + 1;
  const endItem = Math.min(page * page_size, total);

  // Generate page numbers
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(total_pages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="pager">
      <div>
        Menampilkan <b>{startItem}–{endItem}</b> dari <b>{total}</b> data
      </div>
      <nav>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((p) =>
          p === page ? (
            <span key={p} className="cur">
              {p}
            </span>
          ) : (
            <button key={p} type="button" onClick={() => onPageChange(p)}>
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={15} />
        </button>
      </nav>
    </div>
  );
}
