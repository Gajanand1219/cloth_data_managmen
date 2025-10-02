import axios from "axios";

const BASE_URL = "https://shop-4wgy.onrender.com";

// Products
export async function getProducts() {
  const res = await axios.get(`${BASE_URL}/products`);
  return res.data;
}

export async function addProduct(product) {
  const res = await axios.post(`${BASE_URL}/products`, product);
  return res.data;
}

export async function updateProduct(id, product) {
  const res = await axios.put(`${BASE_URL}/products/${id}`, product);
  return res.data;
}

export async function deleteProduct(id) {
  await axios.delete(`${BASE_URL}/products/${id}`);
}

// Sales
export async function createSale(items) {
  const res = await axios.post(`${BASE_URL}/sales`, items);
  return res.data;
}

// Fetch sales by date range
export async function fetchSalesHistory(startDate, endDate) {
  const res = await axios.get(`${BASE_URL}/sales/history`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data;
}

// Fetch all sales
export async function fetchAllSalesHistory() {
  const res = await axios.get(`${BASE_URL}/sales/history/all`);
  return res.data;
}
