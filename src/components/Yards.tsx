import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNodesStore } from '../stores/nodesStore';
import Breadcrumbs from './Breadcrumbs';

const Yards: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { companyYards, currentYard, isLoading, error, fetchCompanyYards } = useNodesStore();

  useEffect(() => {
    if (user && user?.company_ids.length > 0) {
      // 1. Fire an immediate fetch invocation when the component boots up
      fetchCompanyYards(user.company_ids[0]);

      // 2. Setup the background tracking cadence (30,000 milliseconds)
      const intervalId = setInterval(() => {
        fetchCompanyYards(user.company_ids[0]);
      }, 30000);

      // 3. Return the cleanup function to dismantle the tracker on unmount
      return () => clearInterval(intervalId);
    }
  }, [fetchCompanyYards, user?.company_ids[0]]);

  const handleYardClick = (yardId: string) => {
    navigate(`/yard/${yardId}/nodes`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading company yards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentYard?.id.split(':')[0] ?? 'Company Yards'}</h1>
              <div className="mt-2">
                <Breadcrumbs
                  crumbs={[
                    { label: 'Companies', to: '/' },
                    { label: currentYard?.id.split(':')[0] ?? `Company ${user?.company_ids[0]}` },
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

        <div className="mb-6 rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Company Overview</p>
              <div className="mt-2 text-lg font-semibold text-gray-900">{currentYard?.id.split(':')[0] ?? `Company ${user?.company_ids[0]}`}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">{currentYard?.node_count ?? 0} nodes total</div>
              <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${currentYard?.unhealthy_count == 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                {currentYard?.unhealthy_count == 0 ? 'Healthy' : 'Needs attention'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companyYards.map((yard) => (
            <button
              key={yard.id}
              onClick={() => handleYardClick(yard.id)}
              className={`rounded-3xl p-6 text-left shadow transition hover:-translate-y-1 ${
                yard.unhealthy_count === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{yard.id.split(':')[1] ?? 'Unknown Yard'}</h2>
                  <p className="mt-2 text-sm text-gray-600">{yard.node_count} node{yard.node_count === 1 ? '' : 's'}</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  yard.unhealthy_count === 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                }`}>
                  {yard.unhealthy_count === 0 ? 'All OK' : 'Attention'}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-700">
                {yard.unhealthy_count > 0 ? (
                  <span>{yard.unhealthy_count} node{yard.unhealthy_count === 1 ? '' : 's'} flagged</span>
                ) : (
                  <span>All node statuses are good</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {companyYards.length === 0 && !isLoading && (
          <div className="mt-12 rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-600">
            No yards available for this company.
          </div>
        )}
      </main>
    </div>
  );
};

export default Yards;
