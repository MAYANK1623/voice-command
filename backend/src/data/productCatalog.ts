import type { Product } from '../types/index.js'

// Static mock catalog for Day 4's voice-activated search + price filtering
// (Step 11/12 of the brief). A real deployment would source this from a
// grocery partner's product API; this is deliberately static (no DB write
// path, no seed script) since it's reference data the app searches against,
// not user data the app owns — see the Product doc comment in types/index.ts.
// Deliberately includes near-brief-example rows (toothpaste under and over
// $5, an "organic" tagged apple) so the assignment's own sample queries
// ("Find toothpaste under $5", "Find me organic apples") return real results.
//
// Expanded for Day 5, Step 14 (product substitutes): each category now has
// enough depth (multiple brands, price points, and organic/dietary variants
// sharing tags) that "find a substitute" has real alternatives to surface
// instead of one or two token entries per aisle. Every ItemCategory is now
// represented, including 'other' (health/baby/pet — items that don't belong
// in a grocery aisle but are still voice-searchable/addable the same way).
//
// Day 8: `seasonMonths`/`salePercent` added to a subset of rows for Step 23
// (seasonal recommendations) — see the Product/SeasonalRecommendation doc
// comments in types/index.ts and productsService.getSeasonalRecommendations.
export const PRODUCT_CATALOG: Product[] = [
  // --- Household: dental/cleaning/paper ---
  { id: 'prd_1', name: 'Toothpaste', brand: 'Colgate', category: 'household', unit: 'pcs', price: 3.49, tags: ['dental', 'mint'], salePercent: 20 },
  { id: 'prd_2', name: 'Toothpaste', brand: 'Sensodyne', category: 'household', unit: 'pcs', price: 6.99, tags: ['dental', 'sensitive'] },
  { id: 'prd_3', name: 'Whitening Toothpaste', brand: 'Crest', category: 'household', unit: 'pcs', price: 4.29, tags: ['dental', 'whitening'] },
  { id: 'prd_31', name: 'Paper Towels', brand: 'Bounty', category: 'household', unit: 'pack', price: 7.49, tags: [], salePercent: 15 },
  { id: 'prd_32', name: 'Dish Soap', brand: 'Dawn', category: 'household', unit: 'pcs', price: 2.79, tags: [] },
  { id: 'prd_33', name: 'Laundry Detergent', brand: 'Tide', category: 'household', unit: 'pcs', price: 11.99, tags: [] },
  { id: 'prd_34', name: 'Trash Bags', brand: 'Glad', category: 'household', unit: 'pack', price: 6.49, tags: [] },
  { id: 'prd_35', name: 'Toilet Paper', brand: 'Charmin', category: 'household', unit: 'pack', price: 9.99, tags: [] },
  { id: 'prd_36', name: 'Recycled Toilet Paper', brand: 'Seventh Generation', category: 'household', unit: 'pack', price: 10.99, tags: ['eco'] },
  { id: 'prd_37', name: 'Facial Tissue', brand: 'Kleenex', category: 'household', unit: 'pack', price: 2.49, tags: [] },
  { id: 'prd_38', name: 'All-Purpose Cleaner', brand: 'Mrs. Meyer\'s', category: 'household', unit: 'pcs', price: 4.99, tags: ['eco'] },
  { id: 'prd_39', name: 'Glass Cleaner', brand: 'Windex', category: 'household', unit: 'pcs', price: 3.99, tags: [] },
  { id: 'prd_40', name: 'Sponges', brand: 'Scotch-Brite', category: 'household', unit: 'pack', price: 3.29, tags: [] },
  { id: 'prd_41', name: 'Aluminum Foil', brand: 'Reynolds', category: 'household', unit: 'pcs', price: 4.49, tags: [] },
  { id: 'prd_42', name: 'Ziplock Bags', brand: 'Ziploc', category: 'household', unit: 'pack', price: 5.29, tags: [] },
  { id: 'prd_43', name: 'Hand Soap', brand: 'Softsoap', category: 'household', unit: 'pcs', price: 2.99, tags: [] },
  { id: 'prd_44', name: 'Shampoo', brand: 'Head & Shoulders', category: 'household', unit: 'pcs', price: 5.99, tags: [] },
  { id: 'prd_45', name: 'Body Wash', brand: 'Dove', category: 'household', unit: 'pcs', price: 5.49, tags: [] },
  { id: 'prd_46', name: 'Deodorant', brand: 'Old Spice', category: 'household', unit: 'pcs', price: 4.49, tags: [] },
  { id: 'prd_47', name: 'AA Batteries', brand: 'Duracell', category: 'household', unit: 'pack', price: 8.99, tags: [] },
  { id: 'prd_48', name: 'Light Bulbs', brand: 'GE', category: 'household', unit: 'pack', price: 6.99, tags: [] },
  { id: 'prd_49', name: 'Air Freshener', brand: 'Febreze', category: 'household', unit: 'pcs', price: 3.79, tags: [] },

  // --- Produce ---
  // seasonMonths below follow a typical Northern-Hemisphere/US peak-harvest
  // calendar (1=Jan…12=Dec) — same "honest, static, explainable" trade-off
  // as the rest of this file's rule-based data, not a live agricultural
  // feed. Storage crops, tropical imports, and cultivated goods (onions,
  // potatoes, bananas, avocados, mushrooms) have no real "season" to a
  // shopper, so they simply omit seasonMonths rather than guessing one.
  { id: 'prd_4', name: 'Apples', brand: "Nature's Best", category: 'produce', unit: 'kg', price: 4.5, tags: ['organic', 'fruit'], seasonMonths: [9, 10, 11] },
  { id: 'prd_5', name: 'Apples', brand: 'Farm Fresh', category: 'produce', unit: 'kg', price: 2.99, tags: ['fruit'], seasonMonths: [9, 10, 11] },
  { id: 'prd_6', name: 'Gala Apples', brand: 'Orchard Row', category: 'produce', unit: 'kg', price: 3.79, tags: ['organic', 'fruit'], seasonMonths: [9, 10, 11] },
  { id: 'prd_7', name: 'Bananas', brand: 'Chiquita', category: 'produce', unit: 'kg', price: 1.49, tags: ['fruit'] },
  { id: 'prd_8', name: 'Organic Bananas', brand: "Nature's Best", category: 'produce', unit: 'kg', price: 2.29, tags: ['organic', 'fruit'] },
  { id: 'prd_9', name: 'Tomatoes', brand: 'Farm Fresh', category: 'produce', unit: 'kg', price: 3.2, tags: ['vegetable'], seasonMonths: [6, 7, 8, 9], salePercent: 10 },
  { id: 'prd_10', name: 'Organic Spinach', brand: "Nature's Best", category: 'produce', unit: 'pack', price: 3.99, tags: ['organic', 'vegetable', 'leafy green'], seasonMonths: [3, 4, 5, 9, 10, 11] },
  { id: 'prd_50', name: 'Strawberries', brand: 'Driscoll\'s', category: 'produce', unit: 'pack', price: 4.99, tags: ['fruit', 'berry'], seasonMonths: [4, 5, 6] },
  { id: 'prd_51', name: 'Organic Blueberries', brand: 'Driscoll\'s', category: 'produce', unit: 'pack', price: 5.99, tags: ['organic', 'fruit', 'berry'], seasonMonths: [6, 7, 8] },
  { id: 'prd_52', name: 'Broccoli', brand: 'Farm Fresh', category: 'produce', unit: 'kg', price: 2.79, tags: ['vegetable'], seasonMonths: [10, 11, 12, 1, 2, 3] },
  { id: 'prd_53', name: 'Carrots', brand: 'Farm Fresh', category: 'produce', unit: 'kg', price: 1.99, tags: ['vegetable'], seasonMonths: [9, 10, 11] },
  { id: 'prd_54', name: 'Organic Carrots', brand: "Nature's Best", category: 'produce', unit: 'kg', price: 2.99, tags: ['organic', 'vegetable'], seasonMonths: [9, 10, 11] },
  { id: 'prd_55', name: 'Yellow Onions', brand: 'Farm Fresh', category: 'produce', unit: 'kg', price: 1.79, tags: ['vegetable'] },
  { id: 'prd_56', name: 'Russet Potatoes', brand: 'Farm Fresh', category: 'produce', unit: 'kg', price: 2.49, tags: ['vegetable'] },
  { id: 'prd_57', name: 'Bell Peppers', brand: 'Farm Fresh', category: 'produce', unit: 'kg', price: 4.29, tags: ['vegetable'], seasonMonths: [7, 8, 9] },
  { id: 'prd_58', name: 'Cucumbers', brand: 'Farm Fresh', category: 'produce', unit: 'kg', price: 2.29, tags: ['vegetable'], seasonMonths: [6, 7, 8] },
  { id: 'prd_59', name: 'Avocados', brand: 'Orchard Row', category: 'produce', unit: 'pcs', price: 1.99, tags: ['fruit'] },
  { id: 'prd_60', name: 'Lemons', brand: 'Farm Fresh', category: 'produce', unit: 'pcs', price: 0.69, tags: ['fruit', 'citrus'], seasonMonths: [1, 2, 3] },
  { id: 'prd_61', name: 'Grapes', brand: "Nature's Best", category: 'produce', unit: 'kg', price: 4.99, tags: ['fruit'], seasonMonths: [8, 9, 10] },
  { id: 'prd_62', name: 'Mushrooms', brand: 'Farm Fresh', category: 'produce', unit: 'pack', price: 3.49, tags: ['vegetable'] },
  { id: 'prd_63', name: 'Organic Kale', brand: "Nature's Best", category: 'produce', unit: 'pack', price: 3.49, tags: ['organic', 'vegetable', 'leafy green'], seasonMonths: [10, 11, 12, 1, 2] },

  // --- Dairy ---
  { id: 'prd_11', name: 'Whole Milk', brand: 'Dairy Farmers', category: 'dairy', unit: 'l', price: 2.49, tags: [] },
  { id: 'prd_12', name: 'Organic Whole Milk', brand: 'Horizon', category: 'dairy', unit: 'l', price: 4.99, tags: ['organic'] },
  { id: 'prd_13', name: 'Almond Milk', brand: 'Silk', category: 'dairy', unit: 'l', price: 3.99, tags: ['plant-based', 'dairy-free'] },
  { id: 'prd_14', name: 'Oat Milk', brand: 'Oatly', category: 'dairy', unit: 'l', price: 4.49, tags: ['plant-based', 'dairy-free'] },
  { id: 'prd_15', name: 'Cheddar Cheese', brand: 'Tillamook', category: 'dairy', unit: 'pack', price: 5.49, tags: [] },
  { id: 'prd_16', name: 'Greek Yogurt', brand: 'Chobani', category: 'dairy', unit: 'pack', price: 4.29, tags: [], salePercent: 15 },
  { id: 'prd_17', name: 'Large Eggs', brand: 'Happy Hen', category: 'dairy', unit: 'dozen', price: 3.99, tags: [] },
  { id: 'prd_18', name: 'Organic Eggs', brand: 'Vital Farms', category: 'dairy', unit: 'dozen', price: 6.49, tags: ['organic'] },
  { id: 'prd_64', name: 'Salted Butter', brand: 'Land O\'Lakes', category: 'dairy', unit: 'pack', price: 4.49, tags: [] },
  { id: 'prd_65', name: 'Sour Cream', brand: 'Daisy', category: 'dairy', unit: 'pcs', price: 2.49, tags: [] },
  { id: 'prd_66', name: 'Cottage Cheese', brand: 'Breakstone\'s', category: 'dairy', unit: 'pcs', price: 3.29, tags: [] },
  { id: 'prd_67', name: 'Mozzarella Cheese', brand: 'Galbani', category: 'dairy', unit: 'pack', price: 4.99, tags: [] },
  { id: 'prd_68', name: 'Soy Milk', brand: 'Silk', category: 'dairy', unit: 'l', price: 3.79, tags: ['plant-based', 'dairy-free'] },
  { id: 'prd_69', name: 'Vanilla Yogurt', brand: 'Yoplait', category: 'dairy', unit: 'pack', price: 3.99, tags: [] },
  { id: 'prd_70', name: 'Organic Yogurt', brand: 'Stonyfield', category: 'dairy', unit: 'pack', price: 5.29, tags: ['organic'] },

  // --- Bakery ---
  { id: 'prd_19', name: 'Sourdough Bread', brand: "Baker's Own", category: 'bakery', unit: 'pack', price: 4.79, tags: [] },
  { id: 'prd_20', name: 'Whole Wheat Bread', brand: "Baker's Own", category: 'bakery', unit: 'pack', price: 3.29, tags: ['whole wheat'] },
  { id: 'prd_21', name: 'Croissants', brand: 'Le Bon', category: 'bakery', unit: 'pack', price: 5.99, tags: [] },
  { id: 'prd_22', name: 'Bagels', brand: "Baker's Own", category: 'bakery', unit: 'pack', price: 3.49, tags: [] },
  { id: 'prd_71', name: 'White Bread', brand: 'Wonder', category: 'bakery', unit: 'pack', price: 2.79, tags: [] },
  { id: 'prd_72', name: 'Rye Bread', brand: "Baker's Own", category: 'bakery', unit: 'pack', price: 3.99, tags: [] },
  { id: 'prd_73', name: 'English Muffins', brand: 'Thomas\'', category: 'bakery', unit: 'pack', price: 3.49, tags: [] },
  { id: 'prd_74', name: 'Dinner Rolls', brand: "Baker's Own", category: 'bakery', unit: 'pack', price: 3.29, tags: [] },
  { id: 'prd_75', name: 'Cinnamon Rolls', brand: 'Le Bon', category: 'bakery', unit: 'pack', price: 4.99, tags: [] },

  // --- Beverages ---
  { id: 'prd_23', name: 'Sparkling Water', brand: 'LaCroix', category: 'beverages', unit: 'pack', price: 4.99, tags: [] },
  { id: 'prd_24', name: 'Orange Juice', brand: 'Tropicana', category: 'beverages', unit: 'l', price: 3.99, tags: [] },
  { id: 'prd_25', name: 'Ground Coffee', brand: 'Peet’s', category: 'beverages', unit: 'pack', price: 8.99, tags: [], salePercent: 25 },
  { id: 'prd_26', name: 'Green Tea', brand: 'Lipton', category: 'beverages', unit: 'pack', price: 3.49, tags: [] },
  { id: 'prd_76', name: 'Cola', brand: 'Coca-Cola', category: 'beverages', unit: 'pack', price: 5.99, tags: [] },
  { id: 'prd_77', name: 'Diet Cola', brand: 'Coca-Cola', category: 'beverages', unit: 'pack', price: 5.99, tags: ['diet'] },
  { id: 'prd_78', name: 'Lemonade', brand: 'Simply', category: 'beverages', unit: 'l', price: 3.49, tags: [] },
  { id: 'prd_79', name: 'Apple Juice', brand: 'Tropicana', category: 'beverages', unit: 'l', price: 3.49, tags: [] },
  { id: 'prd_80', name: 'Cranberry Juice', brand: 'Ocean Spray', category: 'beverages', unit: 'l', price: 4.29, tags: [] },
  { id: 'prd_81', name: 'Black Tea', brand: 'Lipton', category: 'beverages', unit: 'pack', price: 3.29, tags: [] },
  { id: 'prd_82', name: 'Instant Coffee', brand: 'Nescafé', category: 'beverages', unit: 'pcs', price: 6.49, tags: [] },
  { id: 'prd_83', name: 'Coconut Water', brand: 'Vita Coco', category: 'beverages', unit: 'l', price: 3.99, tags: [] },
  { id: 'prd_84', name: 'Energy Drink', brand: 'Red Bull', category: 'beverages', unit: 'pack', price: 7.99, tags: [] },

  // --- Snacks ---
  { id: 'prd_27', name: 'Tortilla Chips', brand: 'Tostitos', category: 'snacks', unit: 'pack', price: 3.29, tags: [] },
  { id: 'prd_28', name: 'Dark Chocolate', brand: 'Lindt', category: 'snacks', unit: 'pcs', price: 2.99, tags: [] },
  { id: 'prd_29', name: 'Almonds', brand: 'Blue Diamond', category: 'snacks', unit: 'pack', price: 6.99, tags: ['nuts'] },
  { id: 'prd_30', name: 'Organic Popcorn', brand: 'Skinny Pop', category: 'snacks', unit: 'pack', price: 3.99, tags: ['organic'], salePercent: 10 },
  { id: 'prd_85', name: 'Potato Chips', brand: 'Lay\'s', category: 'snacks', unit: 'pack', price: 3.79, tags: [] },
  { id: 'prd_86', name: 'Pretzels', brand: 'Rold Gold', category: 'snacks', unit: 'pack', price: 3.29, tags: [] },
  { id: 'prd_87', name: 'Granola Bars', brand: 'Nature Valley', category: 'snacks', unit: 'pack', price: 4.49, tags: [] },
  { id: 'prd_88', name: 'Organic Granola Bars', brand: 'KIND', category: 'snacks', unit: 'pack', price: 5.99, tags: ['organic'] },
  { id: 'prd_89', name: 'Trail Mix', brand: 'Blue Diamond', category: 'snacks', unit: 'pack', price: 5.49, tags: ['nuts'], salePercent: 20 },
  { id: 'prd_90', name: 'Cheese Crackers', brand: 'Cheez-It', category: 'snacks', unit: 'pack', price: 3.49, tags: [] },
  { id: 'prd_91', name: 'Beef Jerky', brand: 'Jack Link\'s', category: 'snacks', unit: 'pcs', price: 5.99, tags: [] },
  { id: 'prd_92', name: 'Fruit Snacks', brand: 'Welch\'s', category: 'snacks', unit: 'pack', price: 3.99, tags: [] },

  // --- Other: health, baby, pet ---
  { id: 'prd_93', name: 'Multivitamins', brand: 'Centrum', category: 'other', unit: 'pcs', price: 12.99, tags: ['health'] },
  { id: 'prd_94', name: 'Pain Reliever', brand: 'Tylenol', category: 'other', unit: 'pcs', price: 7.49, tags: ['health'] },
  { id: 'prd_95', name: 'Band-Aids', brand: 'Band-Aid', category: 'other', unit: 'pack', price: 3.99, tags: ['health'] },
  { id: 'prd_96', name: 'Sunscreen', brand: 'Neutrogena', category: 'other', unit: 'pcs', price: 9.99, tags: ['health'] },
  { id: 'prd_97', name: 'Dog Food', brand: 'Purina', category: 'other', unit: 'pack', price: 14.99, tags: ['pet'] },
  { id: 'prd_98', name: 'Cat Food', brand: 'Fancy Feast', category: 'other', unit: 'pack', price: 9.99, tags: ['pet'] },
  { id: 'prd_99', name: 'Cat Litter', brand: 'Tidy Cats', category: 'other', unit: 'pack', price: 11.49, tags: ['pet'] },
  { id: 'prd_100', name: 'Baby Wipes', brand: 'Pampers', category: 'other', unit: 'pack', price: 6.99, tags: ['baby'] },
  { id: 'prd_101', name: 'Diapers', brand: 'Pampers', category: 'other', unit: 'pack', price: 19.99, tags: ['baby'] },
]
