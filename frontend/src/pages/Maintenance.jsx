import React, { useState, useEffect } from "react";
import { request } from "../services/api";
import { Card, Form } from "../components/ui/Shared";

const emptyMaintenance = {
  vehicle: "",
  title: "",
  cost: "",
  date: ""
};

export default function Maintenance({ notify, auth }) {
  const [rows, setRows] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyMaintenance);
  const [editingId, setEditingId] = useState(null);

  const canEdit = auth.role === "Fleet Manager";

  const load = async () => {
    const [maintenanceRows, vehicleRows] = await Promise.all([
      request("/maintenance"),
      request("/vehicles")
    ]);

    setRows(maintenanceRows);
    setVehicles(vehicleRows);
  };

  useEffect(() => {
    load().catch((err) => notify(err.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.vehicle || !form.title.trim()) {
      notify("Vehicle and service title are required");
      return;
    }

    if (Number(form.cost) < 0) {
      notify("Cost cannot be negative");
      return;
    }

    try {
      await request(editingId ? `/maintenance/${editingId}` : "/maintenance", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          cost: Number(form.cost || 0)
        })
      });

      setEditingId(null);
      setForm(emptyMaintenance);
      await load();
      notify(editingId ? "Maintenance updated" : "Maintenance started");
    } catch (err) {
      notify(err.message);
    }
  };

  const close = async (id) => {
    try {
      await request(`/maintenance/${id}/close`, { method: "PATCH" });
      await load();
      notify("Maintenance closed");
    } catch (err) {
      notify(err.message);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      vehicle: item.vehicle?._id || item.vehicle || "",
      title: item.title || "",
      cost: item.cost ?? "",
      date: item.date ? String(item.date).slice(0, 10) : ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyMaintenance);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this maintenance record?")) return;

    try {
      await request(`/maintenance/${id}`, { method: "DELETE" });
      await load();
      notify("Maintenance record deleted");

      if (editingId === id) cancelEdit();
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <Card title={editingId ? "Edit Maintenance" : "Maintenance Workflow"}>
      {canEdit && (
        <Form onSubmit={submit}>
          <select required value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
            <option value="">Select Vehicle</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>

          <input placeholder="Service Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Cost" type="number" min="0" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />

          {editingId && <button type="button" className="secondaryBtn" onClick={cancelEdit}>Cancel</button>}
        </Form>
      )}

      <div className="table">
        <div className="row head">
          <span>Vehicle</span><span>Title</span><span>Cost</span><span>Status</span><span>Date</span><span>Actions</span>
        </div>

        {rows.map((item) => (
          <div className="row" key={item._id}>
            <span>{item.vehicle?.name || "-"}</span>
            <span>{item.title || "-"}</span>
            <span>{item.cost ?? "-"}</span>
            <span>{item.status || "-"}</span>
            <span>{item.date ? String(item.date).slice(0, 10) : "-"}</span>
            <span className="rowActions">
              {canEdit && (
                <>
                  {item.status === "Active" && <button type="button" onClick={() => close(item._id)}>Close</button>}
                  <button type="button" onClick={() => startEdit(item)}>Edit</button>
                  <button type="button" className="dangerBtn" onClick={() => remove(item._id)}>Delete</button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}