import React, { useEffect, useState } from 'react';
import { useNodesStore } from '../stores/nodesStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

// 1. Strictly type the company payload metadata returning from your data layers
interface CompanyMetadata {
  id: string;
  yard_count: number;
  node_count: number;
  has_bad_status: boolean;
}

type SortKey = 'id' | 'yard_count' | 'node_count' | 'has_bad_status';
type SortOrder = 'asc' | 'desc';

const AllCompanies: React.FC = () => {
  const { isLoading: isLoadingNode, companies, fetchAllCompanies, error } = useNodesStore();
  const { isLoading: isLoadingAuth, user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllCompanies();
  }, [fetchAllCompanies]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const safeCompanies: CompanyMetadata[] = companies || [];

  // 2. Clear keyword search filtration matching against the identifier
  const filteredCompanies = safeCompanies.filter((c) =>
    (c.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Multi-type sorting algorithm handling strings, numbers, and booleans explicitly
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (sortKey === 'id') {
      const valA = a.id || '';
      const valB = b.id || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (sortKey === 'yard_count' || sortKey === 'node_count') {
      const valA = a[sortKey] || 0;
      const valB = b[sortKey] || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    if (sortKey === 'has_bad_status') {
      const valA = a.has_bad_status ? 1 : 0;
      const valB = b.has_bad_status ? 1 : 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    return 0;
  });

  const renderSortDirectionIndicator = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  if (isLoadingNode || isLoadingAuth) {
    return (
      <div style={{ padding: '32px', fontFamily: 'sans-serif', color: '#666' }}>
        Synchronizing company management infrastructure...
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Control Hub</h1>
              {user && (
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/sysadmin')}
                className="bg-blue-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Control Hub
              </button>

              <button
                onClick={() => navigate('/admin/yards')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Yards
              </button>

              <button
                onClick={() => navigate('/admin/nodes')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Nodes
              </button>
              
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#8e8e93' }}>Enterprise & Organization Directory Matrices</p>
          </div>
          <input
            type="text"
            placeholder="Filter companies by ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '10px 14px', 
              width: '300px', 
              borderRadius: '6px', 
              border: '1px solid #c7c7cc', 
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* 4. Main Matrix Layout completely updated with structural data paths */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f7', borderBottom: '2px solid #d1d1d6' }}>
              <th onClick={() => handleSort('id')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '40%' }}>
                Company ID{renderSortDirectionIndicator('id')}
              </th>
              <th onClick={() => handleSort('yard_count')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '15%', textAlign: 'center' }}>
                Yards{renderSortDirectionIndicator('yard_count')}
              </th>
              <th onClick={() => handleSort('node_count')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '15%', textAlign: 'center' }}>
                Nodes{renderSortDirectionIndicator('node_count')}
              </th>
              <th onClick={() => handleSort('has_bad_status')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '30%', textAlign: 'center' }}>
                Status{renderSortDirectionIndicator('has_bad_status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCompanies.map((company) => (
              <tr key={company.id} style={{ borderBottom: '1px solid #e5e5ea', transition: 'background-color 0.15s' }}>
                <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '13px', color: '#1c1c1e', fontWeight: 600 }}>
                  {company.id}
                </td>
                <td style={{ padding: '16px', textAnchor: 'middle', textAlign: 'center', color: '#3a3a3c' }}>
                  {company.yard_count}
                </td>
                <td style={{ padding: '16px', textAnchor: 'middle', textAlign: 'center', color: '#3a3a3c' }}>
                  {company.node_count}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  {company.has_bad_status ? (
                    <span style={{ backgroundColor: '#ffcc00', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      ⚠️ Active Issue
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#34c759', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      ✓ Operational
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {sortedCompanies.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#8e8e93', fontStyle: 'italic', backgroundColor: '#fafafa' }}>
                  No corporate entities correspond to the specified search keywords.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default AllCompanies;