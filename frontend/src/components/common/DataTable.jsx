import React from 'react';
import SearchBar from './SearchBar';
import Loader from './Loader';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

export const DataTable = ({
  headers = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  renderRow,
  searchVal = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  currentPage = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange
}) => {
  return (
    <div className="space-y-4">
      {onSearchChange && (
        <div className="flex justify-end">
          <SearchBar
            value={searchVal}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full sm:w-72"
          />
        </div>
      )}

      <div className="overflow-hidden border border-white/5 rounded-xl bg-white/[0.02] shadow-inner">
        {loading ? (
          <div className="py-16">
            <Loader size="md" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-[#12101b]">
                <tr>
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      className={`px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${header.className || ''}`}
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((item, idx) => renderRow(item, idx))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 0 && onPageChange && (
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
};
export default DataTable;
