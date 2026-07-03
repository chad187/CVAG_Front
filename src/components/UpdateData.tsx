import React, { useState, useEffect } from 'react';

interface FirmwareUpdatePayload {
  update_status: string;
  version?: string;
  ssid?: string;
  password?: string;
  update_url?: string;
  created_at?: string;
  update_at: string;
}

interface UpdateDataProps {
  nodeId: string;
  firmwareUpdate?: FirmwareUpdatePayload;
  onCancelUpdate: (id: string) => Promise<void> | void;
}

const UpdateData: React.FC<UpdateDataProps> = ({
  nodeId,
  firmwareUpdate,
  onCancelUpdate,
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const hasActiveUpdate = firmwareUpdate && firmwareUpdate.update_status !== '';

  useEffect(() => {
    if (!hasActiveUpdate || !firmwareUpdate?.update_at) return;

    const calculateTimeLeft = () => {
      const targetTime = new Date(firmwareUpdate.update_at).getTime();
      const difference = targetTime - new Date().getTime();

      if (difference <= 0) return 'Executing now...';

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);

    return () => clearInterval(timer);
  }, [firmwareUpdate?.update_at, hasActiveUpdate]);

  if (!hasActiveUpdate) return null;

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'queued': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-gray-900">Scheduled Update Status</h4>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(firmwareUpdate.update_status)}`}>
            {firmwareUpdate.update_status}
          </span>
          
          {firmwareUpdate.update_status?.toLowerCase() === 'pending' && (
            <button
              type="button"
              onClick={() => onCancelUpdate(nodeId)}
              className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10 hover:bg-rose-100 transition-colors"
            >
              Cancel Update
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-4 text-sm">
        <div>
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">SSID</span>
          <span className="mt-0.5 block text-gray-900">{firmwareUpdate.ssid || '—'}</span>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Password</span>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-gray-900">
              {showPassword ? (firmwareUpdate.password || '—') : '••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Version</span>
          <span className="mt-0.5 block font-mono text-gray-900">{firmwareUpdate.version || '—'}</span>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Update URL</span>
          <span className="mt-0.5 block text-gray-900">{firmwareUpdate.update_url || '—'}</span>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Update Created</span>
          <span className="mt-0.5 block text-gray-900">{firmwareUpdate.created_at || '—'}</span>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Execution Time</span>
          <span className="mt-0.5 block text-gray-900">
            {new Date(firmwareUpdate.update_at).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Time Remaining</span>
          <span className="mt-0.5 block font-mono font-semibold text-indigo-600 text-base">
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UpdateData;