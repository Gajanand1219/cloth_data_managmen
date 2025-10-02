import React, { useState } from "react";
import { deleteProduct, updateProduct } from "../api";
import "./display.css";


export default function ShowProducts({ products, fetchProducts }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    await deleteProduct(id);
    fetchProducts();
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setEditData({ ...p });
  };

  const handleSave = async () => {
  await updateProduct(editId, editData);
  setEditId(null);
  fetchProducts(); // reload list from DB
};


  return (
    <div className="product-container">
      <h2 className="title">Products</h2>
      <input
        placeholder="🔍 Search by name or code"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-box"
      />

      <table className="styled-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Code</th>
            <th>Name</th>
            <th>Sell Price</th>
            <th>Cost Price</th>
            <th>Profit/Loss</th>
            <th>Stock</th>
            <th>⚙️ Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const profit =
              (p.sell_price - p.cost_price) * (p.stock || 0);
            return (
              <tr key={p.code}>
                <td>{p.id}</td>
                <td>{p.code}</td>
                <td>
                  {editId === p.id ? (
                    <input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                    />
                  ) : (
                    p.name
                  )}
                </td>
                <td>
                  {editId === p.id ? (
                    <input
                      type="number"
                      value={editData.sell_price}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          sell_price: parseFloat(e.target.value),
                        })
                      }
                    />
                  ) : (
                    `₹${p.sell_price}`
                  )}
                </td>
                <td>₹{p.cost_price}</td>
              <td className={p.profit_loss_total >= 0 ? "profit" : "loss"}>
            ₹{p.profit_loss_total.toFixed(2)}
            </td>

                <td>
                    {editId === p.id ? (
                        <input
                        type="number"
                        value={editData.stock}
                        onChange={(e) =>
                            setEditData({
                            ...editData,
                            stock: parseInt(e.target.value, 10)
                            })
                        }
                        />
                    ) : (
                        p.stock
                    )}
                    </td>


                <td>
                  {editId === p.id ? (
                    <>
                      <button className="btn save" onClick={handleSave}>
                        Save
                      </button>
                      <button
                        className="btn cancel"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn edit"
                        onClick={() => handleEdit(p)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn delete"
                        onClick={() => handleDelete(p.id)}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
