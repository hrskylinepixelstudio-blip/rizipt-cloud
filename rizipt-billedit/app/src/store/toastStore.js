import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],

  push: (message, type = 'success') => {
    const toastItem = { id: ++toastId, message, type };
    set({ toasts: [...get().toasts, toastItem] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== toastItem.id) });
    }, 4000);
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (message) => useToastStore.getState().push(message, 'success'),
  error: (message) => useToastStore.getState().push(message, 'error'),
  info: (message) => useToastStore.getState().push(message, 'info'),
};
