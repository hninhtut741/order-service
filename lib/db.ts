export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: "confirmed" | "failed";
  createdAt: string;
}

const orders: Order[] = [];
let nextId = 1;

export function getOrders(): Order[] {
  return [...orders].reverse();
}

export function createOrder(items: OrderItem[], total: number, status: Order["status"]): Order {
  const order: Order = {
    id: String(nextId++),
    items,
    total,
    status,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  return order;
}
