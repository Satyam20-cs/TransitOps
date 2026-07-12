import React, { useState, useEffect } from "react";
import { request } from "../services/api";
import { Card, Form } from "../components/ui/Shared";

const emptyDriver = {
  name: "",
  licenseNo: "",
  licenseCategory: "LMV",
  licenseExpiry: "",
  contact: "",
  safetyScore: "",
  status: "Available"
};

export default function Drivers({ notify, auth }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyDriver);
  const [editingId, setEditingId] = useState(null);

  const canEdit = ["Fleet Manager", "Safety Officer"].includes(auth.role);

  const load = async () => setRows(await request("/drivers"));

  useEffect(() => {
    load().catch((err) => notify(err.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.licenseNo.trim() || !form.licenseExpiry) {
      notify("Name, license number, and license expiry are required");
      return;
    }

    if (Number(form.safetyScore) < 0 || Number(form.safetyScore) > 100) {
      notify("Safety score must be between 0 and 100");
      return;
    }

    try {
      await request(editingId ? `/drivers/${editingId}` : "/drivers", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          licenseNo: form.licenseNo.trim(),
          safetyScore: Number(form.safetyScore || 0)
        })
      });

      setEditingId(null);
      setForm(emptyDriver);
      await load();
      notify(editingId ? "Driver updated" : "Driver added");
    } catch (err) {
      notify(err.message);
    }
  };

  const startEdit = (driver) => {
    setEditingId(driver._id);
    setForm({
      name: driver.name || "",
      licenseNo: driver.licenseNo || "",
      licenseCategory: driver.licenseCategory || "LMV",
      licenseExpiry: driver.licenseExpiry ? String(driver.licenseExpiry).slice(0, 10) : "",
      contact: driver.contact || "",
      safetyScore: driver.safetyScore ?? "",
      status: driver.status || "Available"
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyDriver);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this driver?")) return;

    try {
      await request(`/drivers/${id}`, { method: "DELETE" });
      await load();
      notify("Driver deleted");

      if (editingId === id) cancelEdit();
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <Card title={editingId ? "Edit Driver" : "Driver Management"}>
      {canEdit && (
        <Form onSubmit={submit}>
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="License No." required value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} />

          <select value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
            <option value="LMV">LMV</option>
            <option value="HMV">HMV</option>
            <option value="Transport">Transport</option>
          </select>

          <input type="date" required value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
          <input placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <input placeholder="Safety Score" type="number" min="0" max="100" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />

          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>

          {editingId && <button type="button" className="secondaryBtn" onClick={cancelEdit}>Cancel</button>}
        </Form>
      )}

      <div className="table">
        <div className="row head">
          <span>Name</span><span>License</span><span>Category</span><span>Expiry</span><span>Score</span><span>Status</span><span>Actions</span>
        </div>

        {rows.map((driver) => (
          <div className="row" key={driver._id}>
            <span>{driver.name || "-"}</span>
            <span>{driver.licenseNo || "-"}</span>
            <span>{driver.licenseCategory || "-"}</span>
            <span>{driver.licenseExpiry ? String(driver.licenseExpiry).slice(0, 10) : "-"}</span>
            <span>{driver.safetyScore ?? "-"}</span>
            <span>{driver.status || "-"}</span>
            <span className="rowActions">
              {canEdit && (
                <>
                  <button type="button" onClick={() => startEdit(driver)}>Edit</button>
                  <button type="button" className="dangerBtn" onClick={() => remove(driver._id)}>Delete</button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}