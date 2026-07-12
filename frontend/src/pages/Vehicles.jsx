import React, { useState, useEffect } from "react";
import { request } from "../services/api";
import { Card, Form } from "../components/ui/Shared";

const emptyVehicle = {
  regNo: "",
  name: "",
  type: "Van",
  maxLoad: "",
  odometer: "",
  acquisitionCost: "",
  region: "West"
};

export default function Vehicles({ notify, auth }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState(null);

  const canEdit = auth.role === "Fleet Manager";

  const load = async () => setRows(await request("/vehicles"));

  useEffect(() => {
    load().catch((err) => notify(err.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.regNo.trim() || !form.name.trim()) {
      notify("Registration number and vehicle name are required");
      return;
    }

    if (Number(form.maxLoad) <= 0) {
      notify("Maximum load must be greater than 0");
      return;
    }

    if (Number(form.odometer) < 0) {
      notify("Odometer cannot be negative");
      return;
    }

    if (Number(form.acquisitionCost) < 0) {
      notify("Acquisition cost cannot be negative");
      return;
    }

    const payload = {
      ...form,
      regNo: form.regNo.trim(),
      name: form.name.trim(),
      maxLoad: Number(form.maxLoad),
      odometer: Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost)
    };

    try {
      await request(editingId ? `/vehicles/${editingId}` : "/vehicles", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      setEditingId(null);
      setForm(emptyVehicle);
      await load();
      notify(editingId ? "Vehicle updated" : "Vehicle registered");
    } catch (err) {
      notify(err.message);
    }
  };

  const startEdit = (vehicle) => {
    setEditingId(vehicle._id);
    setForm({
      regNo: vehicle.regNo || "",
      name: vehicle.name || "",
      type: vehicle.type || "Van",
      maxLoad: vehicle.maxLoad ?? "",
      odometer: vehicle.odometer ?? "",
      acquisitionCost: vehicle.acquisitionCost ?? "",
      region: vehicle.region || "West"
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyVehicle);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;

    try {
      await request(`/vehicles/${id}`, { method: "DELETE" });
      await load();
      notify("Vehicle deleted");

      if (editingId === id) {
        cancelEdit();
      }
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <Card title={editingId ? "Edit Vehicle" : "Vehicle Registry"}>
      {canEdit && (
        <Form onSubmit={submit}>
          <input
            placeholder="Reg No"
            required
            value={form.regNo}
            onChange={(e) => setForm({ ...form, regNo: e.target.value })}
          />

          <input
            placeholder="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <select
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Bus">Bus</option>
          </select>

          <input
            placeholder="Max Load (kg)"
            type="number"
            min="1"
            required
            value={form.maxLoad}
            onChange={(e) => setForm({ ...form, maxLoad: e.target.value })}
          />

          <input
            placeholder="Odometer"
            type="number"
            min="0"
            required
            value={form.odometer}
            onChange={(e) => setForm({ ...form, odometer: e.target.value })}
          />

          <input
            placeholder="Acquisition Cost"
            type="number"
            min="0"
            required
            value={form.acquisitionCost}
            onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
          />

          <select
            required
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          >
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>

          {editingId && (
            <button type="button" className="secondaryBtn" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </Form>
      )}

      <div className="table">
        <div className="row head">
          <span>Reg No</span>
          <span>Name</span>
          <span>Type</span>
          <span>Max Load</span>
          <span>Odometer</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {rows.map((vehicle) => (
          <div className="row" key={vehicle._id}>
            <span>{vehicle.regNo || "-"}</span>
            <span>{vehicle.name || "-"}</span>
            <span>{vehicle.type || "-"}</span>
            <span>{vehicle.maxLoad ?? "-"}</span>
            <span>{vehicle.odometer ?? "-"}</span>
            <span>{vehicle.status || "-"}</span>
            <span className="rowActions">
              {canEdit && (
                <>
                  <button type="button" onClick={() => startEdit(vehicle)}>
                    Edit
                  </button>
                  <button type="button" className="dangerBtn" onClick={() => remove(vehicle._id)}>
                    Delete
                  </button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}