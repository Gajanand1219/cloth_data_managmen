import React, { useState, useEffect } from "react";
import AddProduct from "./components/AddProduct";
import ShowProducts from "./components/ShowProducts";
import CreateSale from "./components/CreateSale";
import SalesHistory from "./components/SalesHistory"; // ✅ import history component
import { getProducts } from "./api";
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [products, setProducts] = useState([]);

  // Fetch products for ShowProducts and CreateSale
  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res || []);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="navbar">
        <h1>👕 Cloth Shop POS</h1>
        <div className="nav-buttons">
          <button onClick={() => setActiveSection("home")}>Home</button>
          <button onClick={() => setActiveSection("add")}>Add Product</button>
          <button onClick={() => setActiveSection("products")}>Products</button>
          <button onClick={() => setActiveSection("sale")}>Sales</button>
          <button onClick={() => setActiveSection("history")}>Sales History</button>
        </div>
      </nav>

      {/* Hero Section */}
      {activeSection === "home" && (
        <div className="hero-section">
          <h2>Welcome to Cloth Shop POS</h2>
          <p>Manage your shop easily with products, inventory, and sales.</p>
          <div className="grid">
            <div className="card" onClick={() => setActiveSection("sale")}>
              <i className="fas fa-dollar-sign text-yellow-600"></i>
              <h3>Create Sale</h3>
              <p>Generate bills and manage customer sales</p>
            </div>

            <div className="card" onClick={() => setActiveSection("products")}>
              <i className="fas fa-box text-green-600"></i>
              <h3>View Products</h3>
              <p>Check available products and stock</p>
            </div>

            <div className="card" onClick={() => setActiveSection("add")}>
              <i className="fas fa-shopping-bag text-blue-600"></i>
              <h3>Add Product</h3>
              <p>Quickly add new items to your inventory</p>
            </div>

            <div className="card" onClick={() => setActiveSection("history")}>
              <i className="fas fa-file-invoice text-purple-600"></i>
              <h3>Sales History</h3>
              <p>View past sales and profit/loss reports</p>
            </div>
          </div>
        </div>
      )}

      {/* Section Rendering */}
      <div className="section-container">
        {activeSection === "add" && <AddProduct refresh={fetchProducts} />}
        {activeSection === "products" && <ShowProducts products={products} fetchProducts={fetchProducts} />}
        {activeSection === "sale" && <CreateSale refreshProducts={fetchProducts} />}
        {activeSection === "history" && <SalesHistory />} {/* ✅ history page */}
      </div>
    </div>
  );
}

export default App;
