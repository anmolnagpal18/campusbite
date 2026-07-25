import React from 'react';
import Button from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalCount, pageSize = 10, onPageChange }) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-black/10 rounded-b-xl">
      <div className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-200">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
        <span className="font-semibold text-gray-200">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
        <span className="font-semibold text-gray-200">{totalCount}</span> results
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={<ChevronLeft className="h-4 w-4" />}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          icon={<ChevronRight className="h-4 w-4" />}
          className="flex-row-reverse"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
export default Pagination;
