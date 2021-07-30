//////////////////////////////////////////////////////////////////////////////////////////
// Cuneiform Tablet Interactive 3D Viewer
// (c) 2019, Virtual Cuneiform Tablet Project: T.Collins, S.I.Woolley, E.Gehlken, E.Ch'ng
// http://virtualcuneiform.org/
// Arcball.js - a class for interacting with the 3D view via mouse/touchscreen
//////////////////////////////////////////////////////////////////////////////////////////

function Arcball(newWidth, newHeight) {
  this.position = new THREE.Vector3(0, 0, 0);               // Current actual position
  this.idealPosition = new THREE.Vector3(0, 0, 0);          // Current ideal position - where we are going
  this.oldPosition = new THREE.Vector3(0, 0, 0);            // Position at start of drag
  this.safePosition = new THREE.Vector3(0, 0, 0);           // Last saved position

  this.rotation = new THREE.Quaternion(0, 0, 0, 1.0);       // Current actual rotation
  this.idealRotation = new THREE.Quaternion(0, 0, 0, 1.0);  // Current ideal rotation
  this.oldRotation = new THREE.Quaternion(0, 0, 0, 1.0);    // Rotation at start of drag
  this.safeRotation = new THREE.Quaternion(0, 0, 0, 1.0);   // Last saved rotation

  this.AdjustWidth = 1.0 / ((newWidth - 1.0) * 0.5);        // Used when mapping mouse coordinates to 
  this.AdjustHeight = 1.0 / ((newHeight - 1.0) * 0.5);      // sphere vector.

  this.startVec = new THREE.Vector3();        // Sphere vector at the start of a ROTATE drag
  this.endVec = new THREE.Vector3();          // Current sphere vector (during a ROTATE drag)

  this.startPoint = new THREE.Vector3();      // Mouse coordinates at the start of a MOVE drag
  this.moveVectors = new THREE.Matrix3();     // Converts mouse movement to 3D movement

  this.animateTarget = { q: null, p: null };  // Position and quaternion of animation end point
  this.isAnimating = false;                   // True if an animation is in progress

  this.EPSILON = 1e-8;
}

// Updates mouse-to-sphere mapping factors when window size is changed
Arcball.prototype.resize = function (newWidth, newHeight) {
  this.AdjustWidth = 1.0 / ((newWidth - 1.0) * 0.5);
  this.AdjustHeight = 1.0 / ((newHeight - 1.0) * 0.5);
}

// Start a drag - either rotation or movement
Arcball.prototype.mouseDown = function (mx, my, isRotating) {
  if (isRotating) {
    this.oldRotation.copy(this.rotation);
    this.startVec = this.mapToSphere(mx, my);
  } else {
    this.startPoint = new THREE.Vector3(mx, my, 0);
    this.oldPosition.copy(this.position);
  }
}

// Advance a drag - mouse has moved after mouseDown call
Arcball.prototype.drag = function (mx, my, isRotating) {
  if (isRotating) {
    this.endVec = this.mapToSphere(mx, my);
    var perp = new THREE.Vector3();
    perp.crossVectors(this.startVec, this.endVec);
    var newRotation = new THREE.Quaternion();
    if (perp.length() > this.EPSILON) {
      newRotation.x = perp.x;
      newRotation.y = perp.y;
      newRotation.z = perp.z;
      newRotation.w = this.startVec.dot(this.endVec);
    } else {
      newRotation.set(0, 0, 0, 1.0);
    }
    this.idealRotation.copy(newRotation).multiply(this.oldRotation).normalize();
  } else {
    var mouseMove = new THREE.Vector3(mx, my, 0);
    mouseMove.sub(this.startPoint).applyMatrix3(this.moveVectors);
    this.idealPosition.copy(this.oldPosition).add(mouseMove);
  }
}

// Automated movement and rotation starts at current position and rotation, and aims for target position and rotation
Arcball.prototype.startAnimation = function (target) {
  this.isAnimating = true;
  this.oldPosition.copy(this.position);
  this.oldRotation.copy(this.rotation);
  this.animateTarget = target;
  var dist = this.position.clone().sub(target.p).length();
  var rotv = new THREE.Vector3(1, 0, 0);
  var rot = rotv.clone().applyQuaternion(this.rotation.clone().conjugate().multiply(target.q)).sub(rotv).length();
  return 0.006 / Math.min(1, Math.max(0.3, Math.max(rot / 2, dist / 50)));
}

// Update animation - interpolates start and end positions/rotations by factor, a, where 0<=a<=1
Arcball.prototype.updateAnimation = function (a) {
  if (this.isAnimating) {
    this.idealPosition.copy(this.oldPosition).multiplyScalar(1 - a).add(this.animateTarget.p.clone().multiplyScalar(a));
    this.idealRotation.copy(this.oldRotation).slerp(this.animateTarget.q, a);
  }
}

// INERTIA FUNCTION - IMPLEMENTS A BASIC INERTIA MODEL
Arcball.prototype.update = function () {
  const damping = 0.85;
  this.position.multiplyScalar(damping).add(this.idealPosition.clone().multiplyScalar(1.0-damping));
  this.rotation.slerp(this.idealRotation, 1.0-damping);
}

Arcball.prototype.setVectors = function (vx, vy) {
  this.moveVectors.set(vx.x, vy.x, 0, vx.y, vy.y, 0, vx.z, vy.z, 0);
}

Arcball.prototype.mapToSphere = function (x, y) {
  var temp = new THREE.Vector2(x * this.AdjustWidth - 1.0, 1.0 - y * this.AdjustHeight);
  var len = temp.length();
  if (len > 1.0) {
    temp.normalize();
    len = 1.0;
  }
  return new THREE.Vector3(temp.x, temp.y, Math.sqrt(1.0 - len));
}
Arcball.prototype.getState = function () {
  var ret = { pos: new THREE.Vector3(), rot: new THREE.Quaternion() };
  ret.pos.copy(this.position);
  ret.rot.copy(this.rotation);
  return ret;
}
Arcball.prototype.setState = function (s) {
  this.idealPosition.copy(s.pos);
  this.idealRotation.copy(s.rot);
}

Arcball.prototype.hasMoved = function () {
  return ~(this.position.equals(this.safePosition) && this.rotation.equals(this.safeRotation));
}
Arcball.prototype.saveState = function () {
  this.safeRotation.copy(this.rotation);
  this.safePosition.copy(this.position);
}
Arcball.prototype.restoreState = function () {
  this.idealRotation.copy(this.safeRotation);
  this.idealPosition.copy(this.safePosition);
}

Arcball.exports = Arcball;
//{"mode":"full","isActive":false}