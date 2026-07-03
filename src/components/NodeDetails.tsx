import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useNodesStore } from '../stores/nodesStore';
import { useAuthStore } from '../stores/authStore';
import Breadcrumbs from './Breadcrumbs';
import UpdateData from './UpdateData';
import FirmwareUpdateForm from './FirmwareUpdateForm';

const NodeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentCompany, currentYard, selectedNode, isLoading, error, fetchNodeDetails, updateNodeFirmware, updateNodeDetails, cancelNodeFirmwareUpdate, resetBattery } = useNodesStore();
  const { user, logout } = useAuthStore();

  const [warningTemp, setWarningTemp] = useState('');
  const [rename, setRename] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      // 1. Fire an immediate fetch invocation when the component boots up
      fetchNodeDetails(id);

      // 2. Setup the background tracking cadence (30,000 milliseconds)
      const intervalId = setInterval(() => {
        fetchNodeDetails(id);
      }, 120000);

      // 3. Return the cleanup function to dismantle the tracker on unmount
      return () => clearInterval(intervalId);
    }
  }, [id, fetchNodeDetails]);

  useEffect(() => {
    if (selectedNode) {
      setWarningTemp(((selectedNode as any).warning_temp ?? 0).toString());
      setRename(selectedNode.name || selectedNode.id.split(':')[2] || '');
    }
  }, [selectedNode]);

  const historyData = selectedNode?.history
    ? [...selectedNode.history]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((item) => ({
          timestamp: item.timestamp,
          temp: item.temp,
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }))
    : [];

  const handleDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    await updateNodeDetails(id, rename, Number(warningTemp));
    // Clear form
    setIsEditing(false);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading node details...</div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Node not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedNode.name || selectedNode.id.split(':')[2]}</h1>
              <div className="mt-2">
                <Breadcrumbs
                  crumbs={[
                    { label: 'Companies', to: '/' },
                    {
                      label: currentCompany?.id ?? id?.split(':')[0] ?? 'Company',
                      to: currentCompany ? `/company/${currentCompany.id}/yards` : `/company/${id?.split(':')[0]}/yards`,
                    },
                    {
                      label: currentYard ? currentYard?.id.split(':')[1] : id ? id.split(':')[1] : 'Yard',
                      to: currentYard ? `/yard/${currentYard.id}/nodes` : id ? `/yard/${id.substring(0, id.lastIndexOf(':'))}/nodes` : undefined,
                    },
                    { label: selectedNode.name || selectedNode.id.split(':')[2] },
                  ]}
                />
              </div>
              {user && (
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              )}
              <p className="mt-1 text-sm text-gray-600">Last updated: {new Date(selectedNode.updated_at).toLocaleString()}</p>
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

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Node Information
              </h3>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!id) return;
                    const confirmed = window.confirm('Are you sure? You should only hit this after the batteries have been replaced with new ones.');
                    if (confirmed) {
                      await resetBattery(id);
                    }
                  }}
                  disabled={isLoading}
                  className="bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  Reset Battery
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    selectedNode.status === 'ok' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  {selectedNode.status}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Temperature</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedNode.temp}°C</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Battery</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedNode.battery}%</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Version</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedNode.version}</dd>
              </div>
              {!isEditing && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Warning Temperature</dt>
                  <dd className="mt-1 text-sm text-gray-900">{((selectedNode as any).warning_temp ?? 0)}°F</dd>
                </div>
              )}
              {isEditing && (
                <form onSubmit={handleDetailsUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="warningTemp" className="block text-sm font-medium text-gray-700">
                      Warning Temperature
                    </label>
                  <input
                    type="number"
                    id="warningTemp"
                    value={warningTemp}
                    onChange={(e) => {
                      // Replace anything that is NOT a digit (0-9) with an empty string
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      setWarningTemp(onlyNums)
                    }}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                  </div>
                  <div>
                    <label htmlFor="rename" className="block text-sm font-medium text-gray-700">
                      Rename Node
                    </label>
                    <input
                      type="text"
                      id="rename"
                      value={rename}
                      onChange={(e) => setRename(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : 'Update Details'}
                  </button>
                </form>
              )}
            </dl>
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">History</h4>
              {historyData.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      
                      <XAxis 
                        // Use the correct key: "timestamp"
                        dataKey="timestamp" 
                        tick={{ fontSize: 10 }} 
                        minTickGap={30}
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          // Format as "HH:MM" (e.g., "04:46")
                          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                        }}
                      />

                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        unit="°F" 
                        // This forces the Y-axis to start and end near your actual temp values
                        domain={['auto', 'auto']} 
                      />

                      <Tooltip 
                        // Format the hover tooltip nicely
                        labelFormatter={(str) => new Date(str).toLocaleString()}
                        formatter={(value: any) => [`${value}°F`, 'Temperature']} 
                      />
                      
                      <Line type="monotone" dataKey="temp" stroke="#2563eb" strokeWidth={2} dot={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  No history data available for this node.
                </div>
              )}
            </div>
          </div>
        </div>

        <UpdateData 
          nodeId={id!} 
          firmwareUpdate={(selectedNode as any).firmware_update} 
          onCancelUpdate={(nodeId) => {
            cancelNodeFirmwareUpdate(nodeId)
          }}
        />

        <FirmwareUpdateForm
          initialVersion={String(Number(selectedNode?.version ?? 0) + 1)}
          fallbackFirmwareName="Select firmware binary file"
          isLoading={isLoading}
          onSubmit={async (v, s, p, url, file) => {
            if (!id || !file) return;
            
            // Wire it straight to either your single node update or your clean batch implementation
            await updateNodeFirmware(id, v, s, p, url, file);
          }}
        />
      </main>
    </div>
  );
};

export default NodeDetails;