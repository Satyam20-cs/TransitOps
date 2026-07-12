import React, { useState, useEffect } from "react";
import { Download, FileText } from "lucide-react";
import { request } from "../services/api";
import { Card, Table } from "../components/ui/Shared";
import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF); 
export default function Reports({ notify }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    request("/reports")
      .then(setRows)
      .catch((err) => notify(err.message));
  }, [notify]);

  const exportCsv = () => {
    const headers = ["vehicle", "regNo", "fuelEfficiency", "operationalCost", "roi"];
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => r[h]).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "transitops-report.csv";
    a.click();
  };
  const exportPdf = () => {
  const doc = new jsPDF();
  doc.text("TransitOps Report", 14, 15);
  doc.autoTable({
    head: [["Vehicle", "Reg No", "Fuel Eff.", "Op. Cost", "ROI"]],
    body: rows.map(r => [r.vehicle, r.regNo, r.fuelEfficiency, r.operationalCost, r.roi]),
    startY: 20
  });
  doc.save("transitops-report.pdf");
};

  return (
    <Card title="Reports & Analytics">
      <div className="actions">
        <button onClick={exportCsv}><Download size={16} /> Export CSV</button>
        <button onClick={exportPdf}><FileText size={16} /> Export PDF</button>
      </div>
      <Table rows={rows} fields={["vehicle", "regNo", "fuelEfficiency", "operationalCost", "roi"]} />
    </Card>
  );
}