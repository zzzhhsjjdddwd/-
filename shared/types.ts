export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type OrderType = 'dine' | 'takeaway' | 'delivery';

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  image?: string | null;
  active: number;
}

export interface Dish {
  id: number;
  category_id: number | null;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  tags?: string | null;
  specs?: string | null; // JSON
  stock: number;
  active: number;
  recommended: number;
  sort_order: number;
  created_at?: string;
  category_name?: string;
}

export interface Customer {
  id: number;
  phone?: string | null;
  name?: string | null;
  avatar?: string | null;
  points: number;
  level: string;
  created_at?: string;
}

export interface Staff {
  id: number;
  username: string;
  name?: string | null;
  role: 'admin' | 'staff';
  active: number;
}

export interface Order {
  id: number;
  order_no: string;
  customer_id: number | null;
  table_no?: string | null;
  order_type: OrderType;
  status: OrderStatus;
  total: number;
  payment_method?: string | null;
  address?: string | null;
  remark?: string | null;
  created_at?: string;
  updated_at?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  dish_id: number | null;
  dish_name: string;
  price: number;
  quantity: number;
  spec?: string | null;
  remark?: string | null;
}

export interface Table {
  id: number;
  code: string;
  seats: number;
  status: 'free' | 'occupied' | 'reserved';
}

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}
