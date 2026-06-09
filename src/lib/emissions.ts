// Carbon emission factors (kg CO2e per unit).
// Sources: UK DEFRA 2023, EPA, Our World in Data — rounded for clarity.
// These are approximations suitable for personal awareness, not auditing.

export type Category = "transport" | "food" | "energy" | "shopping" | "waste";

export interface ActivityPreset {
  id: string;
  category: Category;
  action: string;
  unit: string;
  factor: number; // kg CO2e per 1 unit
  icon: string; // lucide icon name
}

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  transport: { label: "Transport", color: "var(--chart-1)" },
  food: { label: "Food", color: "var(--chart-2)" },
  energy: { label: "Energy", color: "var(--chart-3)" },
  shopping: { label: "Shopping", color: "var(--chart-4)" },
  waste: { label: "Waste", color: "var(--chart-5)" },
};

export const PRESETS: ActivityPreset[] = [
  // Transport
  { id: "car_petrol_km", category: "transport", action: "Petrol car", unit: "km", factor: 0.192, icon: "Car" },
  { id: "car_ev_km", category: "transport", action: "Electric car", unit: "km", factor: 0.053, icon: "Zap" },
  { id: "bus_km", category: "transport", action: "Bus", unit: "km", factor: 0.103, icon: "Bus" },
  { id: "train_km", category: "transport", action: "Train", unit: "km", factor: 0.041, icon: "TramFront" },
  { id: "flight_short_km", category: "transport", action: "Short flight", unit: "km", factor: 0.255, icon: "Plane" },
  { id: "flight_long_km", category: "transport", action: "Long flight", unit: "km", factor: 0.150, icon: "Plane" },
  { id: "bike_km", category: "transport", action: "Cycling", unit: "km", factor: 0, icon: "Bike" },
  // Food (per meal)
  { id: "meal_beef", category: "food", action: "Beef meal", unit: "meal", factor: 7.0, icon: "Beef" },
  { id: "meal_pork", category: "food", action: "Pork meal", unit: "meal", factor: 2.4, icon: "Drumstick" },
  { id: "meal_chicken", category: "food", action: "Chicken meal", unit: "meal", factor: 1.6, icon: "Drumstick" },
  { id: "meal_fish", category: "food", action: "Fish meal", unit: "meal", factor: 1.3, icon: "Fish" },
  { id: "meal_veg", category: "food", action: "Vegetarian meal", unit: "meal", factor: 0.8, icon: "Salad" },
  { id: "meal_vegan", category: "food", action: "Vegan meal", unit: "meal", factor: 0.5, icon: "Leaf" },
  { id: "coffee", category: "food", action: "Coffee", unit: "cup", factor: 0.28, icon: "Coffee" },
  // Energy
  { id: "elec_kwh", category: "energy", action: "Electricity", unit: "kWh", factor: 0.233, icon: "Plug" },
  { id: "gas_kwh", category: "energy", action: "Natural gas", unit: "kWh", factor: 0.184, icon: "Flame" },
  { id: "hot_shower", category: "energy", action: "Hot shower (10 min)", unit: "shower", factor: 0.5, icon: "Droplets" },
  // Shopping
  { id: "new_clothing", category: "shopping", action: "New clothing item", unit: "item", factor: 10, icon: "Shirt" },
  { id: "online_order", category: "shopping", action: "Online order delivery", unit: "order", factor: 0.5, icon: "Package" },
  // Waste
  { id: "trash_kg", category: "waste", action: "Landfill waste", unit: "kg", factor: 0.5, icon: "Trash2" },
  { id: "recycle_kg", category: "waste", action: "Recycled waste", unit: "kg", factor: 0.05, icon: "Recycle" },
];

export function presetById(id: string) {
  return PRESETS.find((p) => p.id === id);
}

export function computeKg(presetId: string, quantity: number) {
  const p = presetById(presetId);
  if (!p) return 0;
  return Math.round(p.factor * quantity * 1000) / 1000;
}

// Reference benchmarks
export const DAILY_GLOBAL_AVG_KG = 12.5; // ~4.6 t/yr
export const DAILY_PARIS_TARGET_KG = 5.5; // ~2 t/yr per capita to hit 1.5°C
