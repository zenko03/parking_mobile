import { useState, useEffect } from "react";
import { vehicleService } from "../services";

export default function useFilters() {
  const [activeFilter, setActiveFilter] = useState(null);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [vehicleCount, setVehicleCount] = useState("");
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Charger les types de véhicules depuis l'API
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoadingVehicles(true);
        const vehicles = await vehicleService.getAllVehicles();

        // Mapper les données de l'API vers le format attendu
        const formattedVehicles = vehicles.map(v => ({
          id: v.id_Vehicles || v.Id_Vehicles,
          name: v.types,
          icon: v.icon
        }));

        setVehicleOptions(formattedVehicles);
      } catch (error) {
        console.error('[Vehicles] Load error:', error.message);
        // En cas d'erreur, utiliser des valeurs par défaut
        setVehicleOptions([
          { id: 1, name: "Voiture", icon: "car-icon" },
          { id: 2, name: "Moto", icon: "motorcycle-icon" },
        ]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadVehicles();
  }, []);

  const toggleVehicleSelection = (vehicleId) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId) ? prev.filter(v => v !== vehicleId) : [...prev, vehicleId]
    );
  };

  return {
    activeFilter,
    setActiveFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedVehicles,
    toggleVehicleSelection,
    vehicleCount,
    setVehicleCount,
    vehicleOptions,
    loadingVehicles
  };
}
