import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { useAuthStore, User } from './authStore';
import toast from 'react-hot-toast';

interface HistoryRecord {
  node_id: string;
  temp: number;
  timestamp: string;
}

interface FirmwareUpdate {
  node_id: string;
  update_status: string;
  version: string;
  ssid: string;
  password: string;
  update_url: string;
  update_at: string;
  created_at: string;
}

export interface NodeStatus {
  id: string;
  name: string;
  temp: number;
  status: string;
  version: string;
  battery: number;
  warning_temp: number;
  created_at: string;
  updated_at: string;
}

interface NodeDetail extends NodeStatus {
  history: HistoryRecord[];
  firmware_update?: FirmwareUpdate;
}

export interface YardSummary {
  id: string;
  node_count: number;
  unhealthy_count: number;
}

export interface SystemMetrics {
  yard_id: string;
  temp_c: number;
  fan_rpm: number;
  load_avg: number;
  ram_used_pct: number;
  disk_used_pct: number;
  goroutines: number;
  updated_at: string;
  system_uptime: number;
}

export const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  
  return parts.length > 0 ? parts.join(' ') : '< 1m';
};

interface CompanySummary {
  id: string;
  yard_count: number;
  node_count: number;
  has_bad_status: boolean;
}

interface NodesState {
  users: User[];
  companies: CompanySummary[];
  companyYards: YardSummary[];
  yards: YardSummary[];
  yardMetrics: Record<string, SystemMetrics>;
  yardNodes: NodeStatus[];
  currentCompany: CompanySummary | null;
  currentYard: YardSummary | null;
  selectedNode: NodeDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchAllUsers: () => Promise<void>;
  fetchYardMetrics: (yardId: string) => Promise<void>;
  fetchAllYards: () => Promise<void>;
  fetchAllNodes: () => Promise<void>;
  editUserCompanies:(userId: string, companyId: string, remove: boolean) => Promise<void>;
  fetchAllCompanies: () => Promise<void>;
  fetchCompanyYards: (companyId: string) => Promise<void>;
  fetchYardNodes: (yardId: string) => Promise<void>;
  fetchNodeDetails: (id: string) => Promise<void>;
  cancelNodeFirmwareUpdate: (id: string) => Promise<void>;
  resetBattery: (id: string) => Promise<void>;
  updateNodeFirmware: (id: string, version: string, ssid: string, password: string, updateUrl: string, firmwareFile: File) => Promise<void>;
  handleBatchFirmwareUpdate: (nodeIdsArray: string[], version: string, ssid: string, password: string, updateUrl: string, firmwareFile: File) => Promise<void>;
  updateNodeDetails: (id: string, name: string, warningTemp: number) => Promise<void>;
  clearError: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const IS_PRODUCTION = import.meta.env.VITE_IN_PRODUCTION === 'true';

const buildAuthHeaders = (token: string | null) => {
  if (!IS_PRODUCTION || !token) {
    return undefined;
  }

  return { Authorization: `Bearer ${token}` };
};

const yardMapSummary = (item: any): YardSummary => ({
  id: item.id || item.ID || '',
  node_count: item.node_count ?? item.NodeCount ?? 0,
  unhealthy_count: item.unhealthy_count ?? item.UnhealthyCount ?? 0,
});

export const useNodesStore = create<NodesState>()(
  devtools((set) => ({
    companies: [],
    companyYards: [],
    yards: [],
    yardNodes: [],
    currentCompany: null,
    currentYard: null,
    yardMetrics: {},
    selectedNode: null,
    isLoading: false,
    error: null,

    fetchAllUsers: async () => {
      // 1. Grab your existing token and check authorization context
      const token = useAuthStore.getState().token;
      if (!token) {
        console.warn("[AuthStore] Cannot fetch users: No token found in state.");
        return;
      }

      // 2. Set your loading flag to update the UI skeleton/spinner
      set({ isLoading: true, error: null });

      try {
        // 3. Hit your backend admin user endpoint
        const response = await axios.get(`${API_BASE}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 4. Update state with the returned array of users
        // (Adjust 'response.data' if your Go API wraps the payload in an object like response.data.users)
        const usersList: User[] = response.data || [];

        set({ 
          users: usersList, 
          isLoading: false 
        });

      } catch (err: any) {
        console.error("Failed to fetch admin users:", err);
        
        set({ 
          isLoading: false, 
          error: err.response?.data?.error || "Failed to sync system users directory" 
        });
      }
    },

    fetchAllYards: async () => {
      // 1. Grab your existing token and check authorization context
      const token = useAuthStore.getState().token;
      if (!token) {
        console.warn("[AuthStore] Cannot fetch users: No token found in state.");
        return;
      }

      // 2. Set your loading flag to update the UI skeleton/spinner
      set({ isLoading: true, error: null });

      try {
        // 3. Hit your backend admin user endpoint
        const response = await axios.get(`${API_BASE}/admin/yards`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 4. Update state with the returned array of users
        // (Adjust 'response.data' if your Go API wraps the payload in an object like response.data.users)
        const yardList: YardSummary[] = response.data || [];

        set({ 
          yards: yardList, 
          isLoading: false 
        });

      } catch (err: any) {
        console.error("Failed to fetch admin yards:", err);
        
        set({ 
          isLoading: false, 
          error: err.response?.data?.error || "Failed to sync system yards directory" 
        });
      }
    },

    fetchYardMetrics: async (yardId: string) => {
      const token = useAuthStore.getState().token;
      if (!token) {
        console.warn("[AuthStore] Cannot fetch yard metrics: No token found in state.");
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const response = await axios.get(`${API_BASE}/metrics/${encodeURIComponent(yardId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const metrics: SystemMetrics = response.data;

        set((state) => ({
          yardMetrics: {
            ...state.yardMetrics,
            [yardId]: metrics,
          },
          isLoading: false,
        }));

      } catch (err: any) {
        toast.error(`Failed to fetch metrics for yard ${yardId}:`, err);

        set({
          isLoading: false,
          error: err.response?.data?.error || `Failed to fetch metrics for yard ${yardId}`,
        });
      }
    },

    fetchAllNodes: async () => {
      // 1. Grab your existing token and check authorization context
      const token = useAuthStore.getState().token;
      if (!token) {
        console.warn("[AuthStore] Cannot fetch users: No token found in state.");
        return;
      }

      // 2. Set your loading flag to update the UI skeleton/spinner
      set({ isLoading: true, error: null });

      try {
        // 3. Hit your backend admin user endpoint
        const response = await axios.get(`${API_BASE}/admin/nodes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 4. Update state with the returned array of users
        // (Adjust 'response.data' if your Go API wraps the payload in an object like response.data.users)
        const nodesList: NodeStatus[] = response.data || [];

        set({ 
          yardNodes: nodesList, 
          isLoading: false 
        });

      } catch (err: any) {
        console.error("Failed to fetch admin users:", err);
        
        set({ 
          isLoading: false, 
          error: err.response?.data?.error || "Failed to sync system users directory" 
        });
      }
    },

    editUserCompanies: async (userId: string, companyId: string, remove: boolean) => {
      // 1. Grab your existing token and check authorization context
      const token = useAuthStore.getState().token;
      if (!token) {
        console.warn("[AuthStore] Cannot fetch users: No token found in state.");
        return;
      }

      // 2. Set your loading flag to update the UI skeleton/spinner
      set({ isLoading: true, error: null });

      try {
        // 3. Hit your backend admin user endpoint
        await axios.post(`${API_BASE}/admin/user/${userId}`, {
          company_id: companyId,
          remove: remove
        },{
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        set({  
          isLoading: false 
        });

        toast.success("User Updated")
        await useNodesStore.getState().fetchAllUsers();

      } catch (err: any) {
        console.error("Failed to fetch admin users:", err);
        const message = err.response?.data?.error || 'Failed to update user';
        set({ 
          isLoading: false, 
          error: err.response?.data?.error || "Failed to sync system users directory" 
        });
        toast.error(message);
      }
    },

    fetchAllCompanies: async () => {
      // 1. Grab your existing token and check authorization context
      const token = useAuthStore.getState().token;
      if (!token) {
        console.warn("[AuthStore] Cannot fetch users: No token found in state.");
        return;
      }

      // 2. Set your loading flag to update the UI skeleton/spinner
      set({ isLoading: true, error: null });

      try {
        // 3. Hit your backend admin user endpoint
        const response = await axios.get(`${API_BASE}/admin/companies`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 4. Update state with the returned array of users
        // (Adjust 'response.data' if your Go API wraps the payload in an object like response.data.users)
        const companyList: CompanySummary[] = response.data || [];

        set({ 
          companies: companyList, 
          isLoading: false 
        });

      } catch (err: any) {
        console.error("Failed to fetch admin companies:", err);
        
        set({ 
          isLoading: false, 
          error: err.response?.data?.error || "Failed to sync system companies" 
        });
      }
    },

    fetchCompanyYards: async (companyId: string) => {
      const token = useAuthStore.getState().token;
      if (IS_PRODUCTION && !token) {
        set({ error: 'Not authenticated' });
        return;
      }

      set({ isLoading: true, error: null, companyYards: [], currentYard: null });
      try {
        const response = await axios.get(`${API_BASE}/company/${companyId}/yards`, {
          headers: buildAuthHeaders(token),
        });
        const companyYards = Array.isArray(response.data)
          ? response.data.map(yardMapSummary)
          : [];

        const totalNodes = companyYards.reduce((sum, yard) => sum + yard.node_count, 0);
        const unhealthyCount = companyYards.reduce((sum, yard) => sum + yard.unhealthy_count, 0);
        const currentCompany: CompanySummary = {
          id: companyId,
          yard_count: companyYards.length,
          node_count: totalNodes,
          has_bad_status: unhealthyCount > 0,
        };

        set({
          companies: [currentCompany],
          companyYards,
          currentCompany,
          isLoading: false,
        });
      } catch (error: any) {
        console.error('Failed to fetch company yards:', error);
        const message = error.response?.data?.error || 'Failed to fetch company yards';
        set({ isLoading: false, error: message });
        toast.error(message);
      }
    },

    fetchYardNodes: async (yardId: string) => {
      const token = useAuthStore.getState().token;
      if (IS_PRODUCTION && !token) {
        set({ error: 'Not authenticated' });
        return;
      }

      set({ isLoading: true, error: null, yardNodes: [], currentYard: null });
      try {
        const response = await axios.get(`${API_BASE}/yard/${yardId}/nodes`, {
          headers: buildAuthHeaders(token),
        });
        const nodes: NodeStatus[] = Array.isArray(response.data) ? response.data : [];
        const unhealthyCount = nodes.filter((node: any) => node.status !== 'OK' && node.status !== 'ok').length;
        set({
          yardNodes: nodes,
          currentYard: {
            id: yardId,
            node_count: nodes.length,
            unhealthy_count: unhealthyCount,
          },
          isLoading: false,
        });
      } catch (error: any) {
        console.error('Failed to fetch yard nodes:', error);
        const message = error.response?.data?.error || 'Failed to fetch yard nodes';
        set({ isLoading: false, error: message });
        toast.error(message);
      }
    },

    fetchNodeDetails: async (id: string) => {
      const token = useAuthStore.getState().token;
      if (IS_PRODUCTION && !token) {
        set({ error: 'Not authenticated' });
        return;
      }

      set({ isLoading: true, error: null, selectedNode: null });
      try {
        const response = await axios.get(`${API_BASE}/nodes/${id}`, {
          headers: buildAuthHeaders(token),
        });
        const nodeData = response.data;
        const node = nodeData?.node;
        const history = nodeData?.history || [];
        const firmware_update = nodeData?.firmware_update;
        
        if (node) {
          const nodeDetail: NodeDetail = {
            ...node,
            history,
            ...(firmware_update && { firmware_update }),
          };
          set({ selectedNode: nodeDetail, isLoading: false });
        } else {
          set({ isLoading: false, error: 'Node details missing from response' });
        }
      } catch (error: any) {
        console.error('Failed to fetch node details:', error);
        const message = error.response?.data?.error || 'Failed to fetch node details';
        set({ isLoading: false, error: message });
        toast.error(message);
      }
    },

    updateNodeDetails: async (id: string, name: string, warningTemp: number) => {
      const token = useAuthStore.getState().token;
      if (IS_PRODUCTION && !token) {
        set({ error: 'Not authenticated' });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        await axios.put(`${API_BASE}/nodes/${id}/details`, {
          name,
          warning_temp: warningTemp,
        }, {
          headers: buildAuthHeaders(token),
        });
        set({ isLoading: false });
        toast.success('Node details updated');
        // Refresh node details after update
        await useNodesStore.getState().fetchNodeDetails(id);
      } catch (error: any) {
        console.error('Failed to update node details:', error);
        const message = error.response?.data?.error || 'Failed to update node details';
        set({ isLoading: false, error: message });
        toast.error(message);
      }
    },

    cancelNodeFirmwareUpdate: async (id: string) => {
      const token = useAuthStore.getState().token;
      if (IS_PRODUCTION && !token) {
        set({ error: 'Not authenticated' });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/update/${id}`, {
          headers: buildAuthHeaders(token),
        });

        set({ isLoading: false });
        toast.success('Firmware canceled');
        await useNodesStore.getState().fetchNodeDetails(id);
      } catch (error: any) {
        console.error('Failed to delete scheduled firmware update:', error);
        const message = error.response?.data?.error || 'Failed to delete scheduled firmware update';
        set({ isLoading: false, error: message });
        toast.error(message);
      }
    },

    resetBattery: async (id: string) => {
      const token = useAuthStore.getState().token;
      if (IS_PRODUCTION && !token) {
        set({ error: 'Not authenticated' });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const formData = new FormData();
        const resetFile = new File([new Uint8Array([0])], 'battery-reset.bin', { type: 'application/octet-stream' });

        formData.append('version', '0');
        formData.append('ssid', 'battery-reset');
        formData.append('password', 'battery-reset');
        formData.append('update_url', 'battery_reset');
        formData.append('firmware', resetFile);

        await axios.post(`${API_BASE}/update/${id}`, formData, {
          headers: buildAuthHeaders(token),
        });

        set({ isLoading: false });
        toast.success('Battery reset requested');
        await useNodesStore.getState().fetchNodeDetails(id);
      } catch (error: any) {
        console.error('Failed to request battery reset:', error);
        const message = error.response?.data?.error || 'Failed to request battery reset';
        set({ isLoading: false, error: message });
        toast.error(message);
      }
    },

    updateNodeFirmware: async (id: string, version: string, ssid: string, password: string, updateUrl: string, firmwareFile: File) => {
      const token = useAuthStore.getState().token;
      if (IS_PRODUCTION && !token) {
        set({ error: 'Not authenticated' });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        // 1. Create the Form Data payload container
        const formData = new FormData();
        
        // 2. Append all text fields using the EXACT names your Go struct tags expect
        formData.append('version', version);
        formData.append('ssid', ssid);
        formData.append('password', password);
        formData.append('update_url', updateUrl);
        
        // 3. Append the raw File object directly (from e.target.files[0])
        formData.append('firmware', firmwareFile); 

        // 4. Send the formData container instead of a raw object literal
        await axios.post(`${API_BASE}/update/${id}`, formData, {
          headers: buildAuthHeaders(token),
          // IMPORTANT: Do NOT manually set 'Content-Type': 'multipart/form-data'.
          // Axios will automatically set it and calculate the correct boundary string.
        });

        set({ isLoading: false });
        toast.success('Firmware update scheduled');
        await useNodesStore.getState().fetchNodeDetails(id);
      } catch (error: any) {
        console.error('Failed to update node firmware:', error);
        const message = error.response?.data?.error || 'Failed to update node firmware';
        set({ isLoading: false, error: message });
        toast.error(message);
      }
    },

    handleBatchFirmwareUpdate: async (nodeIdsArray: string[], version: string, ssid: string, password: string, updateUrl: string, firmwareFile: File) => {
      const token = useAuthStore.getState().token;
      if (IS_PRODUCTION && !token) {
        set({ error: 'Not authenticated' });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const formData = new FormData();
      
        // Convert your string array into a comma-separated format for the backend parser
        formData.append('node_ids', nodeIdsArray.join(','));
        
        // Append form tracking controls matching your struct bindings
        formData.append('version', version);
        formData.append('ssid', ssid);
        formData.append('password', password);
        formData.append('update_url', updateUrl);
        
        if (firmwareFile) {
          formData.append('firmware', firmwareFile);
        }

        await axios.post(`${API_BASE}/updates`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            // Injected authentication token into headers config context
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        set({ isLoading: false });
        toast.success('Firmware updates scheduled');
      }catch (error: any) {
        console.error('Failed to update nodes firmware:', error);
        const message = error.response?.data?.error || 'Failed to update nodes firmware';
        set({ isLoading: false, error: message });
        toast.error(message);
      }
      
    },

    clearError: () => set({ error: null }),
    }),
  {name: 'NodesStore'}
  )
);
