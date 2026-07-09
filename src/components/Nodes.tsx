import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNodesStore, formatUptime } from '../stores/nodesStore';
import Breadcrumbs from './Breadcrumbs';

const Nodes: React.FC = () => {
  const navigate = useNavigate();
  const { id: yardId } = useParams<{ id: string }>();
  const { user, logout } = useAuthStore();
  const { currentCompany, currentYard, yardNodes, isLoading, error, fetchYardNodes, fetchYardMetrics, yardMetrics } = useNodesStore();

  useEffect(() => {
    if (yardId) {
      // 1. Fire an immediate fetch invocation when the component boots up
      fetchYardNodes(yardId);
      fetchYardMetrics(yardId);

      // 2. Setup the background tracking cadence (30,000 milliseconds)
      const intervalId = setInterval(() => {
        fetchYardNodes(yardId);
        fetchYardMetrics(yardId);
      }, 30000);

      // 3. Return the cleanup function to dismantle the tracker on unmount
      return () => clearInterval(intervalId);
    }
  }, [fetchYardNodes, yardId, fetchYardMetrics]);

  const handleNodeClick = (nodeId: string) => {
    navigate(`/node/${nodeId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading yard nodes...</div>
      </div>
    );
  }

  const metrics = yardId ? yardMetrics[yardId] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentYard?.id.split(':')[1] ?? 'Yard Details'}</h1>
              <div className="mt-2">
                <Breadcrumbs
                  crumbs={[
                    { label: 'Companies', to: '/' },
                    {
                      label: currentCompany?.id ?? yardId?.split(':')[0] ?? 'Company',
                      to: currentCompany ? `/company/${currentCompany.id}/yards` : `/company/${yardId?.split(':')[0]}/yards`,
                    },
                    { label: currentYard?.id.split(':')[1] ?? `${yardId}` },
                  ]}
                />
              </div>
              {user && (
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              )}
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-6">
          {/* Yard Overview Card */}
          <div className="mb-6 rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Yard Overview</p>
                <div className="mt-2 text-lg font-semibold text-gray-900">
                  {currentYard?.id.split(':')[1] ?? 'Loading...'}
                </div>
                {metrics && (
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
                )}    
              </div>
              <div className="text-right sm:self-start">
                <div className="text-sm text-gray-500">{currentYard?.node_count ?? 0} nodes</div>
                <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  (currentYard?.unhealthy_count ?? 0) === 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                }`}>
                  {(currentYard?.unhealthy_count ?? 0) === 0 ? 'Healthy' : 'Needs attention'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {yardNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{node?.name || node?.id.split(':')[2] || 'Unknown Node'}</h2>
                  <p className="mt-2 text-sm text-gray-600">Status: <span className={node.status === 'ok' ? 'text-emerald-700' : 'text-red-700'}>{node.status}</span></p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${node.status === 'ok' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {node.status}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Temperature</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{node.temp}°C</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Battery</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{node.battery}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Version</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{node.version}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Last updated: {new Date(node.updated_at).toLocaleString()}
              </div>
            </button>
          ))}

          {yardNodes.length === 0 && !isLoading && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-600">
              No node data available for this yard yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Nodes;
