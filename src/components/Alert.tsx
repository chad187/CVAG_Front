import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNodesStore } from '../stores/nodesStore';
import { useAuthStore } from '../stores/authStore';

interface AlertRecord {
  name: string;
  email: string;
  phone: string;
  language: string;
}

interface RunHistoryItem {
  date: string | number;
  message: string;
}

const sanitizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 11);

const normalizePhoneForSubmission = (value: string) => {
  const digits = sanitizePhoneInput(value);

  if (digits.length === 10) {
    return `1${digits}`;
  }

  return digits;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidPhone = (value: string) => {
  const normalized = normalizePhoneForSubmission(value);
  return normalized.length === 11 && normalized[0] === '1';
};

const formatPhoneForDisplay = (value: string | undefined) => {
  const digits = normalizePhoneForSubmission(value || '');

  if (digits.length === 11) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return digits;
};

const Alert: React.FC = () => {
  const {
    AlertData,
    alertDetails,
    fetchAlert,
    submitAlertMessage,
    broadcastAlert,
    testAlertOne,
    testAlertAll,
    addAlertUser,
    deleteAlertUser,
    deleteAlertHistory,
    isLoading,
    error,
  } = useNodesStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { id: yardId } = useParams<{ id: string }>();

  const [message, setMessage] = useState('');
  const [lastRun, setLastRun] = useState('');
  const [coolDownAmount, setCoolDownAmount] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [editableAlertData, setEditableAlertData] = useState<AlertRecord[]>([]);
  const [dirtyRows, setDirtyRows] = useState<Record<number, boolean>>({});
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'phone' | 'language'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const languageOptions = [
    'English',
    'Spanish',
    'Portuguese',
  ];

  useEffect(() => {
    if (yardId) {
      fetchAlert(yardId);
    }
  }, [fetchAlert, yardId]);

  useEffect(() => {
    setEditableAlertData(AlertData);
    setDirtyRows({});
  }, [AlertData]);

  useEffect(() => {
    if (!alertDetails) {
      return;
    }

    setMessage(alertDetails.message || '');
    setLastRun(formatUtcForLocalInput(alertDetails?.last_run || ''));

    const coolDownValue = typeof alertDetails.cool_down === 'number' ? alertDetails.cool_down : Number(alertDetails.cool_down || 0);
    if (!Number.isNaN(coolDownValue) && coolDownValue > 0) {
      const minutes = coolDownValue / 60000000000;
      setCoolDownAmount(String(minutes));
    } else {
      setCoolDownAmount('');
    }

    setTestEmail(alertDetails.test_email || '');
    setTestPhone(sanitizePhoneInput(alertDetails.test_phone || ''));
    setRunHistory((alertDetails.run_history || []).slice().reverse());
  }, [alertDetails]);

  const removeRunHistoryRow = async (index: number) => {
    if (!yardId) {
      setSubmitStatus('Missing yard ID.');
      return;
    }

    const item = runHistory[index];
    if (!item) {
      return;
    }

    try {
      console.log(item.date);
      console.log(yardId);
      await deleteAlertHistory(yardId, item.date);
      setSubmitStatus('Run history entry deleted successfully.');
    } catch {
      setSubmitStatus('Failed to delete run history entry.');
    }
  };

  const updateAlertRow = (index: number, updatedFields: Partial<AlertRecord>) => {
    setEditableAlertData((current) =>
      current.map((row, idx) => (idx === index ? { ...row, ...updatedFields } : row))
    );
    setDirtyRows((current) => ({ ...current, [index]: true }));
  };

  const handleBroadcastClick = () => {
    if (!message.trim()) {
      setSubmitStatus('Enter a Alert message before broadcasting.');
      return;
    }

    setShowBroadcastModal(true);
  };

  const formatUtcForLocalInput = (utcString: string): string => {
    if (!utcString) return '';
    const date = new Date(utcString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

  const confirmBroadcast = async () => {
    setShowBroadcastModal(false);
    setSubmitStatus('Broadcast in progress...');
    if (!yardId) {
      setSubmitStatus('Missing yard ID.');
      return;
    }

    try {
      await broadcastAlert(yardId);
      setSubmitStatus('Broadcast alert sent successfully.');
    } catch {
      setSubmitStatus('Failed to broadcast alert.');
    }
  };

  const cancelBroadcast = () => {
    setShowBroadcastModal(false);
  };

  const handleTestAllClick = async () => {
    if (!message.trim()) {
      setSubmitStatus('Enter a Alert message before sending a test alert.');
      return;
    }

    if (!yardId) {
      setSubmitStatus('Missing yard ID.');
      return;
    }

    setSubmitStatus('Sending test-all alert...');
    try {
      await testAlertAll(yardId);
      setSubmitStatus('Test all alert sent successfully.');
    } catch {
      setSubmitStatus('Failed to send test all alert.');
    }
  };

  const handleTestOneClick = async () => {
    if (!message.trim()) {
      setSubmitStatus('Enter a Alert message before sending a test alert.');
      return;
    }

    if (!yardId) {
      setSubmitStatus('Missing yard ID.');
      return;
    }

    setSubmitStatus('Sending test-one alert...');
    try {
      await testAlertOne(yardId);
      setSubmitStatus('Test one alert sent successfully.');
    } catch {
      setSubmitStatus('Failed to send test one alert.');
    }
  };

  const handleSaveRow = async (index: number) => {
    if (!yardId) {
      setSubmitStatus('Missing yard ID.');
      return;
    }

    const row = editableAlertData[index];
    if (!row?.email?.trim()) {
      setSubmitStatus('Email is required before saving an alert user.');
      return;
    }

    if (!isValidEmail(row.email)) {
      setSubmitStatus('Please enter a valid email address before saving an alert user.');
      return;
    }

    try {
      await addAlertUser(yardId, row);
      setDirtyRows((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
      setSubmitStatus('Alert user saved successfully.');
    } catch {
      setSubmitStatus('Failed to save alert user.');
    }
  };

  const handleDeleteRow = async (index: number) => {

    const row = editableAlertData[index];
    if (!row?.email?.trim()) {
      setSubmitStatus('Email is required before deleting an alert user.');
      return;
    }

    deleteAlertUser(yardId!, row.email)
  };

  const toggleSort = (column: 'name' | 'email' | 'phone' | 'language') => {
    if (sortBy === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(column);
    setSortDirection('asc');
  };

  const sortedAlertData = [...editableAlertData]
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const a = left.record[sortBy].toLowerCase();
      const b = right.record[sortBy].toLowerCase();

      if (a < b) return sortDirection === 'asc' ? -1 : 1;
      if (a > b) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus('');

    if (!yardId) {
      setSubmitStatus('Missing yard ID.');
      return;
    }

    if (!isValidEmail(testEmail)) {
      setSubmitStatus('Please enter a valid test email address.');
      return;
    }

    if (!isValidPhone(testPhone)) {
      setSubmitStatus('Please enter a valid test phone number.');
      return;
    }

    try {
      await submitAlertMessage(yardId, {
        message,
        last_run: lastRun,
        cool_down: coolDownAmount ? Number(coolDownAmount) * 60 * 1_000_000_000 : 0,
        test_email: testEmail,
        test_phone: normalizePhoneForSubmission(testPhone),
        run_history: runHistory,
      });
      setSubmitStatus('Alert form submitted successfully.');
    } catch {
      setSubmitStatus('Failed to submit Alert form.');
    }
  };

  return (
    <div style={{ padding: '32px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alert Control</h1>
              {user && <p className="text-sm text-gray-600">SysAdmin: {user.name}</p>}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(yardId ? `/yard/${yardId}/nodes` : '/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Back to Nodes
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

        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Broadcast</h2>
              <p className="mt-4 text-gray-600">
                Your message will go out to every user on the list.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelBroadcast}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmBroadcast}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Confirm Broadcast
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleBroadcastClick}
                className="text-white rounded-md font-medium transition-colors"
                style={{ backgroundColor: '#dc2626', padding: '10px 16px' }}
              >
                Broadcast Alert
              </button>
              <button
                type="button"
                onClick={handleTestAllClick}
                className="text-black rounded-md font-medium transition-colors"
                style={{ backgroundColor: '#fde047', padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Test All Alert
              </button>
              <button
                type="button"
                onClick={handleTestOneClick}
                className="text-black rounded-md font-medium transition-colors"
                style={{ backgroundColor: '#fde047', padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Test One Alert
              </button>
            </div>
            <div>
              <label htmlFor="AlertMessage" style={{ fontWeight: 600, color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                Alert Message
              </label>
              <textarea
                id="AlertMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type paragraphs of words here..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  resize: 'vertical',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label htmlFor="lastRun" style={{ fontWeight: 600, color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                  Last Run (date/time)
                </label>
                <input
                  id="lastRun"
                  type="datetime-local"
                  value={lastRun}
                  onChange={(e) => setLastRun(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
              <div>
                <label htmlFor="coolDownAmount" style={{ fontWeight: 600, color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                  Cool Down (minutes)
                </label>
                <input
                  id="coolDownAmount"
                  type="number"
                  min="0"
                  value={coolDownAmount}
                  onChange={(e) => setCoolDownAmount(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label htmlFor="testEmail" style={{ fontWeight: 600, color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                  Test Email
                </label>
                <input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
              <div>
                <label htmlFor="testPhone" style={{ fontWeight: 600, color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                  Test Phone
                </label>
                <input
                  id="testPhone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={testPhone}
                  onChange={(e) => setTestPhone(sanitizePhoneInput(e.target.value))}
                  placeholder="12092399426"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {isLoading ? 'Submitting...' : 'Submit'}
                </button>
                {submitStatus && (
                  <span style={{ color: '#2563eb', fontSize: '14px' }}>{submitStatus}</span>
                )}
              </div>
            </div>
          </div>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th
                  style={{ padding: '16px', color: '#111827', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => toggleSort('name')}
                >
                  Name {sortBy === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  style={{ padding: '16px', color: '#111827', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => toggleSort('email')}
                >
                  Email {sortBy === 'email' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  style={{ padding: '16px', color: '#111827', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => toggleSort('phone')}
                >
                  Phone {sortBy === 'phone' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  style={{ padding: '16px', color: '#111827', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => toggleSort('language')}
                >
                  Language {sortBy === 'language' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ padding: '16px', color: '#111827', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAlertData.map(({ record, index }) => (
                <tr key={`alert-row-${index}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px' }}>
                    <input
                      type="text"
                      value={record.name}
                      onChange={(e) => updateAlertRow(index, { name: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <input
                      type="email"
                      value={record.email}
                      onChange={(e) => updateAlertRow(index, { email: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </td>
                  <td style={{ padding: '16px', color: '#374151' }}>
                    <input
                      type="tel"
                      value={formatPhoneForDisplay(record.phone)}
                      readOnly
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontSize: '14px' }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select
                      value={record.language}
                      onChange={(e) => updateAlertRow(index, { language: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    >
                      {languageOptions.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '16px', display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleSaveRow(index)}
                      disabled={!dirtyRows[index]}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {editableAlertData.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    No Alert records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '32px', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Run History</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '16px', color: '#111827', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '16px', color: '#111827', fontWeight: 700 }}>Message</th>
                <th style={{ padding: '16px', color: '#111827', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {runHistory.map((item, index) => (
                <tr key={`${item.date}-${index}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px', color: '#111827' }}>{item.date ? new Date(item.date).toLocaleString() : '—'}</td>
                  <td style={{ padding: '16px', color: '#374151' }}>{item.message || '—'}</td>
                  <td style={{ padding: '16px' }}>
                    <button
                      type="button"
                      onClick={() => removeRunHistoryRow(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {runHistory.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    No run history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Alert;
