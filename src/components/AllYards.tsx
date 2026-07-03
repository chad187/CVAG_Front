import React, { useEffect, useState } from 'react';
import { useNodesStore, formatUptime } from '../stores/nodesStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { YardSummary } from '../stores/nodesStore';

type SortKey = 'id' | 'node_count' | 'unhealthy_count';
type SortOrder = 'asc' | 'desc';

const AllYards: React.FC = () => {
  // Pulling target fields from your existing global Zustand state pools
  const { isLoading: isloadingNode, yards, fetchAllYards, fetchYardMetrics, yardMetrics, error } = useNodesStore();
  const { isLoading: isLoadingAuth, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Safeguard dependency array by tracking the action reference
  useEffect(() => {
    fetchAllYards();
  }, [fetchAllYards]);

  // Local View States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedYardId, setExpandedYardId] = useState<string | null>(null);

  const handleRowClick = (yardId: string) => {
    if (expandedYardId === yardId) {
      setExpandedYardId(null);
    } else {
      setExpandedYardId(yardId);
      if (!yardMetrics[yardId]) {
        fetchYardMetrics(yardId);
      }
    }
  };

  // Interactive Sorting Column State Evaluation Handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Cast safely, ensuring an array fallback value is present if store is null/undefined
  const typedYards: YardSummary[] = yards || [];

  // 1. Defensively clean identity filtering strings to protect against empty value sets
  const filteredYards = typedYards.filter((yard) => {
    const yardId = yard && yard.id ? String(yard.id) : '';
    return yardId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 2. Explicitly separate string comparison algorithms from numerical sorting loops
  const sortedYards = [...filteredYards].sort((a, b) => {
    if (sortKey === 'node_count' || sortKey === 'unhealthy_count') {
      const valA = a[sortKey] || 0;
      const valB = b[sortKey] || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    // Default string fallback calculation matching identifier blocks
    const valA = a.id ? String(a.id) : '';
    const valB = b.id ? String(b.id) : '';
    
    return sortOrder === 'asc'
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  const renderSortDirectionIndicator = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  if (isloadingNode || isLoadingAuth) {
    return (
      <div style={{ padding: '32px', fontFamily: 'sans-serif', color: '#666' }}>
        Synchronizing cluster management data...
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
            
            {/* Navigation & Action Button Cluster */}
            <div className="flex items-center gap-4">
          
              <button
                onClick={() => navigate('/admin/companies')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Companies
              </button>

              <button
                onClick={() => navigate('/sysadmin')}
                className="bg-blue-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Control Hub
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

      {/* Structural Filter View Header */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#8e8e93' }}>Yard Infrastructure Matrices</p>
          </div>
          <input
            type="text"
            placeholder="Filter yards via identifier..."
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

        {/* Main Administrative Directory Data Layout Frame */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f7', borderBottom: '2px solid #d1d1d6' }}>
              <th onClick={() => handleSort('id')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '40%' }}>
                Yard Identifier{renderSortDirectionIndicator('id')}
              </th>
              <th onClick={() => handleSort('node_count')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, textAlign: 'center', width: '30%' }}>
                Total Transmitting Nodes{renderSortDirectionIndicator('node_count')}
              </th>
              <th onClick={() => handleSort('unhealthy_count')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, textAlign: 'center', width: '30%' }}>
                Unhealthy Nodes Status{renderSortDirectionIndicator('unhealthy_count')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedYards.map((yard) => {
              const isExpanded = expandedYardId === yard.id;
              const currentUnhealthyCount = yard.unhealthy_count || 0;
              return (
                <React.Fragment key={yard.id || Math.random().toString()}>
                  <tr 
                    onClick={() => handleRowClick(yard.id)} 
                    style={{
                      borderBottom: isExpanded ? 'none' : '1px solid #e5e5ea',
                      backgroundColor: isExpanded ? '#f0f4ff' : '#fff',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: '#1c1c1e' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                          {yard.id === "" ? "unassigned_yard_id" : yard.id}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#3a3a3c', textAlign: 'center', fontWeight: 500 }}>
                      {yard.node_count || 0}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: currentUnhealthyCount > 0 ? '#ffebee' : '#e8f5e9',
                        color: currentUnhealthyCount > 0 ? '#c62828' : '#2e7d32'
                      }}>
                        {currentUnhealthyCount} {currentUnhealthyCount === 1 ? 'Error Fault' : 'Error Faults'}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={3} style={{ padding: '16px 32px 20px', background: '#f8f9ff', borderBottom: '1px solid #e5e5ea' }}>
                        {isloadingNode && <div style={{ color: '#8e8e93', fontSize: '13px' }}>Loading metrics...</div>}
                        {!isloadingNode && yardMetrics[yard.id] && (() => {
                          const metrics = yardMetrics[yard.id];
                          return (
                            <>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {[
                                  { label: 'TEMP', value: `${metrics.temp_c.toFixed(1)}°C` },
                                  { label: 'FAN RPM', value: metrics.fan_rpm.toLocaleString() },
                                  { label: 'LOAD AVG', value: metrics.load_avg.toFixed(2) },
                                  { label: 'RAM USED', value: `${metrics.ram_used_pct.toFixed(0)}%` },
                                  { label: 'DISK USED', value: `${metrics.disk_used_pct.toFixed(0)}%` },
                                  { label: 'GOROUTINES', value: metrics.goroutines.toLocaleString() },
                                ].map(({ label, value }) => (
                                  <div key={label} style={{ background: '#fff', border: '1px solid #e0e4ff', borderRadius: '8px', padding: '10px 16px', textAlign: 'center', minWidth: '100px', flex: '1' }}>
                                    <div style={{ fontSize: '10px', color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1e' }}>{value}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginTop: '10px', fontSize: '11px', color: '#aeaeb2' }}>
                                <div>Last updated: {new Date(metrics.updated_at).toLocaleString()}</div>
                                <div>Uptime: {formatUptime(metrics.system_uptime)}</div>
                              </div>
                            </>
                          );
                        })()}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* Empty fallback conditional row layout block */}
            {sortedYards.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#8e8e93', fontStyle: 'italic', backgroundColor: '#fafafa' }}>
                  No yard parameters match the specified search query criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default AllYards;