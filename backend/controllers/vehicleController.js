import {Vehicle} from "../models/index.js";

export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const {
      regNo,
      name,
      type = "Van",
      maxLoad,
      odometer = 0,
      acquisitionCost = 0,
      region = "West",
      status = "Available"
    } = req.body;

    if (!regNo || !name || !maxLoad) {
      return res.status(400).json({
        message: "Registration number, vehicle name, and maximum load are required"
      });
    }

    if (Number(maxLoad) <= 0) {
      return res.status(400).json({ message: "Maximum load must be greater than 0" });
    }

    if (Number(odometer) < 0) {
      return res.status(400).json({ message: "Odometer cannot be negative" });
    }

    if (Number(acquisitionCost) < 0) {
      return res.status(400).json({ message: "Acquisition cost cannot be negative" });
    }

    const vehicle = await Vehicle.create({
      regNo: regNo.trim(),
      name: name.trim(),
      type,
      maxLoad: Number(maxLoad),
      odometer: Number(odometer),
      acquisitionCost: Number(acquisitionCost),
      region,
      status
    });

    res.status(201).json(vehicle);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Registration number must be unique" });
    }

    res.status(400).json({ message: err.message || "Could not create vehicle" });
  }
};