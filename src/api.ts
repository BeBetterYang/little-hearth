import { Dish, HomeSettings, Order } from './types';

export interface AppState {
  dishes: Dish[];
  orders: Order[];
  todayMenuIds: string[];
  homeSettings: HomeSettings;
}

interface UploadedFile {
  filename: string;
  module: 'dishes' | 'orders' | 'home';
  url: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: init?.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function getAppData() {
  return request<AppState>('/api/data');
}

export function createDish(dish: Dish) {
  return request<Dish>('/api/dishes', {
    method: 'POST',
    body: JSON.stringify(dish),
  });
}

export function updateDish(dish: Dish) {
  return request<Dish>(`/api/dishes/${dish.id}`, {
    method: 'PUT',
    body: JSON.stringify(dish),
  });
}

export function deleteDish(id: string) {
  return request<void>(`/api/dishes/${id}`, {
    method: 'DELETE',
  });
}

export function updateTodayMenu(todayMenuIds: string[]) {
  return request<{ todayMenuIds: string[] }>('/api/menu', {
    method: 'PUT',
    body: JSON.stringify({ todayMenuIds }),
  });
}

export function createOrder(order: Order) {
  return request<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export function deleteOrder(id: string) {
  return request<void>(`/api/orders/${id}`, {
    method: 'DELETE',
  });
}

export function updateHomeSettings(homeSettings: HomeSettings) {
  return request<HomeSettings>('/api/home-settings', {
    method: 'PUT',
    body: JSON.stringify(homeSettings),
  });
}

export function searchDishImage(name: string) {
  const params = new URLSearchParams({ name });
  return request<{ title: string; url: string; sourceUrl?: string }>(`/api/dish-image-search?${params.toString()}`);
}

export async function uploadImages(module: 'dishes' | 'orders' | 'home', files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const result = await request<{ files: UploadedFile[] }>(`/api/uploads/${module}`, {
    method: 'POST',
    body: formData,
  });

  return result.files;
}
