/**
 * Fruit definitions. Physics, scoring, and the drop table read tier, radius, and score.
 * Drawing reads `visual` only. To swap in images later, change `visual` to
 * `{ type: 'image', key: 'some-texture' }` and extend paintFruit. Do not change radius
 * from inside the renderer — the collider has to match the number stored here.
 *
 * Scores are the triangular sequence from the design notes. Points are awarded when a
 * merge creates that tier. Tier 0 is only dropped, so its score is the catalog value
 * and is not added on a drop.
 */
export const FRUITS = Object.freeze([
  def(0, 'pip', 'Pip', 18, 1, 0xff8fab, 0xe56b8a),
  def(1, 'berry', 'Berry', 25, 3, 0xe11d48, 0x9f1239),
  def(2, 'grape', 'Grape', 33, 6, 0x7c3aed, 0x5b21b6),
  def(3, 'plum', 'Plum', 42, 10, 0x2563eb, 0x1d4ed8),
  def(4, 'orange', 'Orange', 52, 15, 0xf97316, 0xc2410c),
  def(5, 'peach', 'Peach', 63, 21, 0xfb923c, 0xea580c),
  def(6, 'lemon', 'Lemon', 75, 28, 0xfacc15, 0xca8a04),
  def(7, 'apple', 'Apple', 88, 36, 0xdc2626, 0x991b1b),
  def(8, 'kiwi', 'Kiwi', 100, 45, 0x65a30d, 0x4d7c0f),
  def(9, 'melon', 'Melon', 112, 55, 0x15803d, 0x166534),
]);

export const MAX_TIER = FRUITS.length - 1;

function def(tier, id, name, radius, score, fill, stroke) {
  return Object.freeze({
    tier,
    id,
    name,
    radius,
    score,
    visual: Object.freeze({ type: 'circle', fill, stroke }),
  });
}

export function fruitByTier(tier) {
  return FRUITS[tier];
}

export function paintFruit(node, shine, fruit, radiusScale = 1) {
  const visual = fruit.visual;
  if (visual.type !== 'circle') {
    throw new Error(`Unsupported fruit visual "${visual.type}" on ${fruit.id}.`);
  }

  const radius = fruit.radius * radiusScale;
  node.setRadius(radius);
  node.setFillStyle(visual.fill, 1);
  node.setStrokeStyle(Math.max(2, radius * 0.08), visual.stroke, 1);
  if (shine) {
    shine.setRadius(Math.max(3, radius * 0.22));
    shine.setFillStyle(0xffffff, 0.42);
  }
  return radius;
}
