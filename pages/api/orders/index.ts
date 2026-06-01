import type { NextApiRequest, NextApiResponse } from "next";
import { getOrders, createOrder } from "../../../lib/db";

const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || "http://localhost:3002";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json(getOrders());
  }

  if (req.method === "POST") {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    const total = items.reduce((sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty, 0);

    // Call inventory-service to reduce stock
    const stockItems = items.map((item: { productId: string; qty: number }) => ({
      productId: item.productId,
      qty: item.qty,
    }));

    let status: "confirmed" | "failed" = "confirmed";
    let stockError: string | null = null;

    try {
      const stockRes = await fetch(`${INVENTORY_URL}/api/reduce-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: stockItems }),
      });
      if (!stockRes.ok) {
        const body = await stockRes.json();
        status = "failed";
        stockError = body.error || "Stock reduction failed";
      }
    } catch {
      status = "failed";
      stockError = "inventory-service unreachable";
    }

    const order = createOrder(items, total, status);

    if (status === "failed") {
      return res.status(400).json({ order, error: stockError });
    }

    return res.status(201).json({ order });
  }

  res.status(405).json({ error: "Method not allowed" });
}
