import React, { useEffect, useState } from 'react';
import { useNodesStore, NodeStatus } from '../stores/nodesStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

type SortKey = 'name' | 'status' | 'temp' | 'battery' | 'version' | 'updated_at';
type SortOrder = 'asc' | 'desc';

const AllNodes: React.FC = () => {
  // Pulling target fields from your existing global Zustand state pools
  const { isLoading: isLoadingNode, yardNodes, fetchAllNodes, error } = useNodesStore();
  const { isLoading: isLoadingAuth, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Safeguard dependency array by tracking the action reference
  useEffect(() => {
    if (fetchAllNodes) {
      fetchAllNodes();
    }
  }, [fetchAllNodes]);

  // Local View States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
  const safeNodes: NodeStatus[] = yardNodes || [];

  // 1. Defensively clean identity filtering strings to protect against empty value sets
  const filteredNodes = safeNodes.filter((node) => {
    const name = node?.name ? String(node.name).toLowerCase() : '';
    const status = node?.status ? String(node.status).toLowerCase() : '';
    const version = node?.version ? String(node.version).toLowerCase() : '';
    const query = searchTerm.toLowerCase();

    return name.includes(query) || status.includes(query) || version.includes(query);
  });

  // 2. Explicitly separate string comparison algorithms from numerical sorting loops
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    if (sortKey === 'temp' || sortKey === 'battery') {
      const valA = a[sortKey] || 0;
      const valB = b[sortKey] || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    // Default string fallback calculation matching telemetry identifiers
    const valA = a[sortKey] ? String(a[sortKey]) : '';
    const valB = b[sortKey] ? String(b[sortKey]) : '';

    return sortOrder === 'asc'
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  const renderSortDirectionIndicator = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  if (isLoadingNode || isLoadingAuth) {
    return (
      <div style={{ padding: '32px', fontFamily: 'sans-serif', color: '#666' }}>
        Synchronizing cluster management data...
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Universal Admin Header */}
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
                onClick={() => navigate('/admin/yards')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Yards
              </button>

              <button
                onClick={() => navigate('/sysadmin')}
                className="bg-blue-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Control Hub
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
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#8e8e93' }}>
              Real-Time Hardware Endpoint Telemetry Matrices
            </p>
          </div>
          <input
            type="text"
            placeholder="Filter nodes via name, status, firmware..."
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
              <th onClick={() => handleSort('name')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '25%' }}>
                Node Name/ID{renderSortDirectionIndicator('name')}
              </th>
              <th onClick={() => handleSort('status')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '20%', textAlign: 'center' }}>
                Operational Status{renderSortDirectionIndicator('status')}
              </th>
              <th onClick={() => handleSort('temp')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '15%', textAlign: 'center' }}>
                Temperature{renderSortDirectionIndicator('temp')}
              </th>
              <th onClick={() => handleSort('battery')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '15%', textAlign: 'center' }}>
                Battery{renderSortDirectionIndicator('battery')}
              </th>
              <th onClick={() => handleSort('version')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '10%', textAlign: 'center' }}>
                Firmware{renderSortDirectionIndicator('version')}
              </th>
              <th onClick={() => handleSort('updated_at')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600, width: '15%', textAlign: 'center' }}>
                Last Broadcast{renderSortDirectionIndicator('updated_at')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedNodes.map((node) => {
              const nodeName = node.name || 'unnamed_endpoint';
              const nodeStatus = node.status || 'Unknown';
              const tempValue = node.temp || 0;
              const warningLimit = node.warning_temp || 0;
              const isTempCritical = tempValue >= warningLimit;
              const batteryValue = node.battery ?? 0;
              const isBatteryLow = batteryValue <= 20;

              return (
                <tr key={node.id || Math.random().toString()} style={{ borderBottom: '1px solid #e5e5ea', transition: 'background-color 0.15s' }}>
                  {/* Name and ID Column */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#1c1c1e', fontWeight: 600 }}>{nodeName}</div>
                    <div style={{ fontSize: '11px', color: '#8e8e93', fontFamily: 'monospace', marginTop: '2px' }}>{node.id || 'no_hw_uuid'}</div>
                  </td>
                  
                  {/* Status Badge formatted exactly like Company status tags */}
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {nodeStatus === "ok" ? (
                      <span style={{ backgroundColor: '#34c759', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                        ✓ {nodeStatus}
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#ffcc00', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                        ⚠️ {nodeStatus}
                      </span>
                    )}
                  </td>

                  {/* Temperature Performance */}
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: isTempCritical ? '#ff3b30' : '#3a3a3c', fontWeight: isTempCritical ? 'bold' : 'normal' }}>
                    <div>{tempValue.toFixed(1)}°C</div>
                    {warningLimit > 0 && (
                      <div style={{ fontSize: '11px', color: '#8e8e93', marginTop: '2px' }}>Limit: {warningLimit}°C</div>
                    )}
                  </td>

                  {/* Battery Capacity Status */}
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: isBatteryLow ? '#ff3b30' : '#3a3a3c', fontWeight: isBatteryLow ? 'bold' : 'normal' }}>
                    {batteryValue}%
                  </td>

                  {/* Firmware Revision Tag */}
                  <td style={{ padding: '16px', textAlign: 'center', fontFamily: 'monospace', fontSize: '13px', color: '#3a3a3c' }}>
                    {node.version ? `v${node.version}` : 'v0.0.0'}
                  </td>

                  {/* Processed Update Datetime */}
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#8e8e93' }}>
                    {node.updated_at 
                      ? new Date(node.updated_at).toLocaleString([], { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit' 
                        })
                      : '--/--/-- --:--:--'}
                  </td>
                </tr>
              );
            })}

            {/* Empty fallback conditional row layout block */}
            {sortedNodes.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#8e8e93', fontStyle: 'italic', backgroundColor: '#fafafa' }}>
                  No hardware endpoints match your filter constraints.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default AllNodes;