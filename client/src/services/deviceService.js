import axiosInstance from "./axiosInstance";

export const deviceService = {
  // Get all devices for the logged-in user
  getDevices: async () => {
    const response = await axiosInstance.get("/devices");
    return response.data;
  },

  // Get one device by ID
  getDevice: async (id) => {
    const response = await axiosInstance.get(`/devices/${id}`);
    return response.data;
  },

  // Register a new device
  registerDevice: async (data) => {
    const response = await axiosInstance.post("/devices", data);
    return response.data;
  },

  // Update device trust status (Trusted, Pending, Blocked)
  updateDeviceTrust: async (id, status) => {
    const response = await axiosInstance.put(`/devices/${id}/trust`, { status });
    return response.data;
  },

  // Delete a device
  deleteDevice: async (id) => {
    const response = await axiosInstance.delete(`/devices/${id}`);
    return response.data;
  }
};

// Named function exports for direct import flexibility
export const getDevices = deviceService.getDevices;
export const getDevice = deviceService.getDevice;
export const registerDevice = deviceService.registerDevice;
export const updateDeviceTrust = deviceService.updateDeviceTrust;
export const deleteDevice = deviceService.deleteDevice;

export default deviceService;
