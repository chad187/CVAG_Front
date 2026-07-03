import React, { useEffect, useState } from 'react';
import { useNodesStore } from '../stores/nodesStore';
import { useAuthStore } from '../stores/authStore';
import { UserCompanies } from  './UserCompanies';
import { useNavigate } from 'react-router-dom';

type SortKey = 'name' | 'email' | 'created_at' | 'last_login';
type SortOrder = 'asc' | 'desc';

const SysAdmin: React.FC = () => {
    const { isLoading: isloadingNode, users, fetchAllUsers, fetchAllCompanies, editUserCompanies, error } = useNodesStore();
    const { isLoading: isLoadingAuth, user, logout } = useAuthStore();
		const navigate = useNavigate();

  useEffect(() => {
    fetchAllUsers()
    fetchAllCompanies()
  }, []);

  // Local UI State Handles
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

  // 1. Live Filter calculation: Drops the table layout view states instantly if search yields no array indices
  const filteredUsers = (users || []).filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Alpha-numeric & Time Data Grid Matrix sort execution map
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const valA = a[sortKey] || '';
    const valB = b[sortKey] || '';

    if (sortKey === 'created_at' || sortKey === 'last_login') {
      return sortOrder === 'asc'
        ? new Date(valA).getTime() - new Date(valB).getTime()
        : new Date(valB).getTime() - new Date(valA).getTime();
    }

    return sortOrder === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const renderSortDirectionIndicator = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  if (isloadingNode || isLoadingAuth) {
    return (
      <div style={{ padding: '32px', fontFamily: 'sans-serif', color: '#666' }}>
        Synchronizing system management...
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
								onClick={() => {
									navigate('/admin/companies')
								}}
								className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
							>
								Companies
							</button>

							<button
								onClick={() => {
									navigate('/admin/yards')
								}}
								className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
							>
								Yards
							</button>

							<button
								onClick={() => {
									navigate('/admin/nodes')
								}}
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
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#8e8e93' }}>Personnel Directory Matrices</p>
            </div>
            <input
            type="text"
            placeholder="Filter table fields via keywords..."
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
                <th onClick={() => handleSort('name')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600 }}>
                Full Name{renderSortDirectionIndicator('name')}
                </th>
                <th onClick={() => handleSort('email')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600 }}>
                Email{renderSortDirectionIndicator('email')}
                </th>
                <th onClick={() => handleSort('created_at')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600 }}>
                Account Created{renderSortDirectionIndicator('created_at')}
                </th>
                <th onClick={() => handleSort('last_login')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none', color: '#48484a', fontWeight: 600 }}>
                Last Login{renderSortDirectionIndicator('last_login')}
                </th>
                <th style={{ padding: '16px', color: '#48484a', fontWeight: 600 }}>Companies</th>
            </tr>
            </thead>
            <tbody>
            {sortedUsers.map((profile) => (
                <tr key={profile.id} style={{ borderBottom: '1px solid #e5e5ea', transition: 'background-color 0.15s' }}>
                <td style={{ padding: '16px', fontWeight: 600, color: '#1c1c1e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {profile.picture && <img src={profile.picture} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                    <span>{profile.name}</span>
                    </div>
                </td>
                <td style={{ padding: '16px', color: '#3a3a3c' }}>{profile.email}</td>
                <td style={{ padding: '16px', fontSize: '13px', color: '#8e8e93' }}>
                    {new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </td>
                <td style={{ padding: '16px', fontSize: '13px', color: '#8e8e93' }}>
                    {new Date(profile.last_login).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </td>
                <td style={{ padding: '16px' }}>
                    <UserCompanies 
                        userId={profile.id}
                        associatedCompanies={profile?.company_ids ?? []}
                        onAddCompany={(userId, companyId) => {
                        editUserCompanies(userId, companyId, false)
                        }}
                        onRemoveCompany={(userId, companyId) => {
                        editUserCompanies(userId, companyId, true)
                        }}
                    />
                </td>
                </tr>
            ))}

            {/* Empty fallback conditional row layout block: fires when search input string completely isolates out all matches */}
            {sortedUsers.length === 0 && (
                <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#8e8e93', fontStyle: 'italic', backgroundColor: '#fafafa' }}>
                    No database entities correspond to the specified search keywords.
                </td>
                </tr>
            )}
            </tbody>
        </table>
			</main>
    </div>
  );
};

export default SysAdmin;
