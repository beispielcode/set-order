// Helper function to rotate a 3D vector aroud an axis
// Rotate one vector (vect) around another (axis) by the specified angle.
function rotateAround(p5, vect, axis, angle) {
  // Make sure our axis is a unit vector
  axis = p5.Vector.normalize(axis);

  return p5.Vector.add(
    p5.Vector.mult(vect, Math.cos(angle)),
    p5.Vector.add(
      p5.Vector.mult(p5.Vector.cross(axis, vect), Math.sin(angle)),
      p5.Vector.mult(
        p5.Vector.mult(axis, p5.Vector.dot(axis, vect)),
        1 - Math.cos(angle)
      )
    )
  );
}
