/**
 * Collision detection utilities for 2D game objects
 */

/**
 * Check for collision between two rectangles
 * @param {Object} rectA - First rectangle {x, y, width, height}
 * @param {Object} rectB - Second rectangle {x, y, width, height}
 * @returns {boolean} True if rectangles overlap
 */
export function checkRectCollision(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

/**
 * Check for collision between a point and a rectangle
 * @param {Object} point - Point {x, y}
 * @param {Object} rect - Rectangle {x, y, width, height}
 * @returns {boolean} True if point is inside rectangle
 */
export function checkPointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check for collision between two circles
 * @param {Object} circleA - First circle {x, y, radius}
 * @param {Object} circleB - Second circle {x, y, radius}
 * @returns {boolean} True if circles overlap
 */
export function checkCircleCollision(circleA, circleB) {
  const dx = circleA.x - circleB.x;
  const dy = circleA.y - circleB.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < circleA.radius + circleB.radius;
}

/**
 * Check for collision between a circle and a rectangle
 * @param {Object} circle - Circle {x, y, radius}
 * @param {Object} rect - Rectangle {x, y, width, height}
 * @returns {boolean} True if circle and rectangle overlap
 */
export function checkCircleRectCollision(circle, rect) {
  // Find the closest point to the circle within the rectangle
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate the distance between the circle's center and this closest point
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;

  // If the distance is less than the circle's radius, an intersection occurs
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;
  return distanceSquared < circle.radius * circle.radius;
}

/**
 * Check if a rectangle is completely contained within another rectangle
 * @param {Object} innerRect - Inner rectangle {x, y, width, height}
 * @param {Object} outerRect - Outer rectangle {x, y, width, height}
 * @returns {boolean} True if innerRect is completely inside outerRect
 */
export function isRectContained(innerRect, outerRect) {
  return (
    innerRect.x >= outerRect.x &&
    innerRect.y >= outerRect.y &&
    innerRect.x + innerRect.width <= outerRect.x + outerRect.width &&
    innerRect.y + innerRect.height <= outerRect.y + outerRect.height
  );
}

/**
 * Calculate the overlap between two rectangles
 * @param {Object} rectA - First rectangle {x, y, width, height}
 * @param {Object} rectB - Second rectangle {x, y, width, height}
 * @returns {Object|null} Overlap rectangle {x, y, width, height} or null if no collision
 */
export function getRectOverlap(rectA, rectB) {
  if (!checkRectCollision(rectA, rectB)) {
    return null;
  }

  const x = Math.max(rectA.x, rectB.x);
  const y = Math.max(rectA.y, rectB.y);
  const width = Math.min(rectA.x + rectA.width, rectB.x + rectB.width) - x;
  const height = Math.min(rectA.y + rectA.height, rectB.y + rectB.height) - y;

  return {x, y, width, height};
}

/**
 * Calculate collision response (simple bounce)
 * @param {Object} body - Body with position and velocity {x, y, vx, vy}
 * @param {Object} surfaceNormal - Normal vector of the surface {x, y}
 * @param {number} restitution - Bounciness factor (0-1)
 * @returns {Object} Updated velocity {vx, vy}
 */
export function calculateBounce(body, surfaceNormal, restitution = 0.8) {
  // Normalize the surface normal
  const length = Math.sqrt(
    surfaceNormal.x * surfaceNormal.x + surfaceNormal.y * surfaceNormal.y
  );
  const nx = surfaceNormal.x / length;
  const ny = surfaceNormal.y / length;

  // Calculate dot product of velocity and normal
  const dot = body.vx * nx + body.vy * ny;

  // Calculate reflected velocity
  const vx = body.vx - 2 * dot * nx * restitution;
  const vy = body.vy - 2 * dot * ny * restitution;

  return {vx, vy};
}
