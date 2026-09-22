export const MENU_CATEGORIES = ["Drinks", "Snacks", "Meals"] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  tag: string;
};

export const MENU: MenuItem[] = [
  { id: "d1", name: "Espresso", price: 95, category: "Drinks", tag: "Hot" },
  { id: "d2", name: "Cappuccino", price: 125, category: "Drinks", tag: "Hot" },
  { id: "d3", name: "Caffè Latte", price: 130, category: "Drinks", tag: "Hot" },
  { id: "d4", name: "Spanish Latte", price: 140, category: "Drinks", tag: "Iced" },
  { id: "d5", name: "Kape Barako", price: 110, category: "Drinks", tag: "Hot" },
  { id: "d6", name: "Iced Americano", price: 115, category: "Drinks", tag: "Iced" },
  { id: "d7", name: "Matcha Latte", price: 150, category: "Drinks", tag: "Iced" },
  { id: "d8", name: "Chocolate Frappe", price: 145, category: "Drinks", tag: "Iced" },
  { id: "d9", name: "Calamansi Iced Tea", price: 90, category: "Drinks", tag: "Iced" },
  { id: "d10", name: "Sparkling Yuzu", price: 120, category: "Drinks", tag: "Cold" },
  { id: "s1", name: "Ensaymada", price: 65, category: "Snacks", tag: "Sweet" },
  { id: "s2", name: "Butter Croissant", price: 85, category: "Snacks", tag: "Baked" },
  { id: "s3", name: "Banana Muffin", price: 70, category: "Snacks", tag: "Baked" },
  { id: "s4", name: "Choc Chip Cookie", price: 55, category: "Snacks", tag: "Sweet" },
  { id: "s5", name: "Cheese Rolls", price: 60, category: "Snacks", tag: "Baked" },
  { id: "s6", name: "Polvoron Bites", price: 50, category: "Snacks", tag: "Sweet" },
  { id: "m1", name: "Adobo Rice Bowl", price: 185, category: "Meals", tag: "Savory" },
  { id: "m2", name: "Tuna Melt Sandwich", price: 165, category: "Meals", tag: "Savory" },
  { id: "m3", name: "Carbonara", price: 195, category: "Meals", tag: "Pasta" },
  { id: "m4", name: "Chicken Pesto Panini", price: 175, category: "Meals", tag: "Savory" },
  { id: "m5", name: "Breakfast Plate", price: 210, category: "Meals", tag: "All-day" },
  { id: "m6", name: "Veggie Wrap", price: 150, category: "Meals", tag: "Light" },
];
