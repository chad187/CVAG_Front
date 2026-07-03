import React, { useState, useEffect } from 'react';

interface FirmwareUpdateFormProps {
  initialVersion: string;
  fallbackFirmwareName?: string;
  isLoading: boolean;
  onSubmit: (
    version: string,
    ssid: string,
    password: string,
    updateUrl: string,
    file: File | null
  ) => Promise<void> | void;
}

const FirmwareUpdateForm: React.FC<FirmwareUpdateFormProps> = ({
  initialVersion,
  fallbackFirmwareName = 'No file chosen',
  isLoading,
  onSubmit,
}) => {

  const UPDATE_URL = import.meta.env.VITE_UPDATE_URL || 'http://localhost:8080/update';
  const [version, setVersion] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [updateUrl, setUpdateUrl] = useState(UPDATE_URL);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  

  // Sync with dynamic settings from your store when node information loads
  useEffect(() => {
    setVersion(initialVersion);
  }, [initialVersion]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.bin')) {
        alert('Please select a valid .bin firmware file.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(version, ssid, password, updateUrl, selectedFile);
    
    // Clear out volatile form data post-submission
    setSsid('');
    setPassword('');
    setSelectedFile(null);
  };

  return (
    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Update Node Firmware
        </h3>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700">
              Version
            </label>
            <input
              type="text"
              id="version"
              value={version}
              onChange={(e) => {
                // Replace anything that is NOT a digit (0-9) with an empty string
                const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                setVersion(onlyNums);
              }}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              required
            />
          </div>

          <div>
            <label htmlFor="ssid" className="block text-sm font-medium text-gray-700">
              SSID
            </label>
            <input
              type="text"
              id="ssid"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="updateUrl" className="block text-sm font-medium text-gray-700">
              Update URL
            </label>
            <input
              type="url"
              id="updateUrl"
              value={updateUrl}
              onChange={(e) => setUpdateUrl(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="firmware" className="block text-sm font-medium text-gray-700">
              Firmware Compiled Binary (.bin)
            </label>
            <div className="mt-1 flex items-center gap-4">
              <label
                htmlFor="firmware-upload"
                className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Choose File
              </label>
              <input
                id="firmware-upload"
                type="file"
                accept=".bin"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-sm text-gray-500">
                {selectedFile ? selectedFile.name : fallbackFirmwareName}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Firmware'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirmwareUpdateForm;