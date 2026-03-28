# Kinematics — JEE Physics

## 1. Introduction to Motion

Motion is a change in position of an object with respect to time. The study of motion without considering the forces that cause it is called **kinematics**. Kinematics deals with the description of motion in terms of displacement, velocity, and acceleration.

### Frame of Reference
A frame of reference is a system of coordinates and clocks used to describe the position and motion of objects. An observer at rest in a reference frame describes motion differently from an observer in a different frame. The choice of frame is arbitrary, but results must be consistent within the chosen frame.

### Point Object Approximation
An object can be treated as a point object if its size is much smaller than the distance it covers during motion. For example, a car traveling between two cities can be treated as a point object, but not when studying its parking.

---

## 2. Distance and Displacement

### Distance
Distance is the total path length traveled by an object. It is a **scalar quantity** (has only magnitude). Distance is always positive or zero, never negative.

**Key properties:**
- Scalar quantity
- Always ≥ 0
- Path-dependent
- SI unit: metre (m)

### Displacement
Displacement is the change in position of an object. It is a **vector quantity** (has both magnitude and direction). Displacement is the shortest distance between the initial and final positions.

**Formula:** Δx = x₂ - x₁

**Key properties:**
- Vector quantity
- Can be positive, negative, or zero
- Path-independent (depends only on initial and final positions)
- |Displacement| ≤ Distance
- SI unit: metre (m)

### Important Distinction
If a particle moves from A to B and back to A:
- Distance traveled = 2 × AB
- Displacement = 0

---

## 3. Speed and Velocity

### Speed
Speed is the rate of change of distance with respect to time.

**Average Speed** = Total distance / Total time = s/t

**Instantaneous Speed** = lim(Δt→0) Δs/Δt = ds/dt

- Speed is a scalar quantity
- Speed is always ≥ 0
- SI unit: m/s

### Velocity
Velocity is the rate of change of displacement with respect to time.

**Average Velocity** = Total displacement / Total time = Δx/Δt = (x₂ - x₁)/(t₂ - t₁)

**Instantaneous Velocity** = lim(Δt→0) Δx/Δt = dx/dt

- Velocity is a vector quantity
- Velocity can be positive, negative, or zero
- SI unit: m/s
- The magnitude of velocity equals speed only for straight-line motion without direction change

### Important Relations
- Average speed ≥ |Average velocity|
- For uniform motion: average speed = instantaneous speed
- If velocity is constant, speed is constant (but not vice versa)

---

## 4. Acceleration

Acceleration is the rate of change of velocity with respect to time.

**Average Acceleration** = Δv/Δt = (v₂ - v₁)/(t₂ - t₁)

**Instantaneous Acceleration** = lim(Δt→0) Δv/Δt = dv/dt

- Acceleration is a vector quantity
- SI unit: m/s²
- When acceleration is in the direction of velocity, the object speeds up (acceleration)
- When acceleration is opposite to velocity, the object slows down (deceleration or retardation)

### Uniform Acceleration
When the acceleration of an object remains constant throughout the motion, it is called uniformly accelerated motion.

---

## 5. Equations of Motion (Uniformly Accelerated Motion)

For motion with constant acceleration **a**, initial velocity **u**, final velocity **v**, displacement **s**, and time **t**:

### First Equation of Motion
**v = u + at**

Derivation: From a = (v - u)/t, we get v = u + at

### Second Equation of Motion
**s = ut + ½at²**

Derivation: 
- Average velocity = (u + v)/2 = (u + u + at)/2 = u + at/2
- s = average velocity × t = (u + at/2) × t = ut + ½at²

### Third Equation of Motion
**v² = u² + 2as**

Derivation: From v = u + at → t = (v-u)/a
Substituting in s = ut + ½at²:
s = u(v-u)/a + ½a[(v-u)/a]²
2as = 2u(v-u) + (v-u)²
2as = v² - u²
**v² = u² + 2as**

### Distance traveled in nth second
**sₙ = u + a(2n-1)/2**

### Important Notes
- These equations are valid only for constant acceleration
- These are vector equations; in 1D they work with signs
- For freely falling bodies, replace a with g (≈ 9.8 m/s²) and s with h

---

## 6. Motion Under Gravity (Free Fall)

When an object is released from a height or thrown vertically, it experiences gravitational acceleration.

### Downward Motion (Taking downward as positive)
- v = u + gt
- h = ut + ½gt²
- v² = u² + 2gh

### Upward Motion (Taking upward as positive)
- v = u - gt
- h = ut - ½gt²
- v² = u² - 2gh

### Key Results for Free Fall (dropped from rest, u = 0)
- Velocity after time t: v = gt
- Distance fallen in time t: h = ½gt²
- Velocity after falling height h: v = √(2gh)
- Time to fall height h: t = √(2h/g)

### Object Thrown Vertically Upward (with initial velocity u)
- Time to reach maximum height: t = u/g
- Maximum height reached: H = u²/(2g)
- Total time of flight: T = 2u/g
- Speed on returning to starting point = u (same as initial speed)
- The motion is symmetric: time of ascent = time of descent

---

## 7. Graphs of Motion

### Position-Time Graph (x-t graph)
- **Stationary object**: Horizontal line
- **Uniform velocity**: Straight line with slope = velocity
- **Uniform acceleration**: Parabola
- Slope at any point = instantaneous velocity
- A steeper slope means higher speed

### Velocity-Time Graph (v-t graph)
- **Uniform velocity**: Horizontal line
- **Uniform acceleration**: Straight line with slope = acceleration
- **Non-uniform acceleration**: Curved line
- Slope at any point = instantaneous acceleration
- Area under the curve = displacement
- The magnitude of area under curve = distance (considering signs)

### Acceleration-Time Graph (a-t graph)
- **Uniform acceleration**: Horizontal line
- Area under the curve = change in velocity

### Key Points About Graphs
1. x-t graph can never be perpendicular to time axis (infinite velocity not possible)
2. v-t graph area gives displacement (area above x-axis is positive, below is negative)
3. The sign of slope of v-t graph gives direction of acceleration

---

## 8. Relative Motion

The velocity of object A with respect to object B:
**v_AB = v_A - v_B**

### Cases:
1. **Same direction**: v_AB = v_A - v_B (relative velocity decreases)
2. **Opposite direction**: v_AB = v_A + v_B (relative velocity increases)
3. **At angle θ**: |v_AB| = √(v_A² + v_B² - 2v_A·v_B·cosθ)

### Applications
- **Two cars moving in same direction**: They appear slower relative to each other
- **Two cars moving in opposite directions**: They approach each other faster
- **Rain and umbrella problem**: To stay dry, tilt umbrella in the direction of relative velocity of rain w.r.t. person

---

## 9. Projectile Motion

When an object is projected with some initial velocity and it moves under gravity alone, the motion is called projectile motion. The path of a projectile is a **parabola**.

### Assumptions
- Acceleration due to gravity (g) is constant
- Air resistance is negligible
- Rotation of Earth is ignored

### Projectile Launched at Angle θ with Horizontal

Initial velocity components:
- Horizontal: uₓ = u cosθ
- Vertical: uᵧ = u sinθ

**At any time t:**
- Horizontal position: x = (u cosθ)t
- Vertical position: y = (u sinθ)t - ½gt²
- Horizontal velocity: vₓ = u cosθ (constant)
- Vertical velocity: vᵧ = u sinθ - gt

### Key Formulas

**Time of Flight (T):** T = 2u sinθ / g

**Maximum Height (H):** H = u² sin²θ / (2g)

**Horizontal Range (R):** R = u² sin2θ / g

**Maximum Range:** When θ = 45°, R_max = u²/g

**Equation of Trajectory:** y = x tanθ - gx²/(2u²cos²θ)

This is a parabolic equation.

### Important Results
1. For complementary angles (θ and 90°-θ), the range is the same
2. Maximum height is achieved at θ = 90° (vertical throw)
3. Maximum range is achieved at θ = 45°
4. At maximum height, velocity is purely horizontal = u cosθ
5. Time of ascent = Time of descent = T/2

### Horizontal Projectile (Thrown horizontally from height h)
- Time to reach ground: t = √(2h/g)
- Horizontal distance: R = u × √(2h/g)
- Velocity on hitting ground: v = √(u² + 2gh)
- Angle with horizontal on hitting: tanα = gt/u = √(2gh)/u

---

## 10. Circular Motion (Uniform)

When an object moves along a circular path with constant speed, the motion is called uniform circular motion.

### Key Quantities

**Angular Displacement (θ):** Angle swept by the radius vector. Unit: radian

**Angular Velocity (ω):** Rate of change of angular displacement
ω = dθ/dt = 2π/T = 2πf
- T = time period
- f = frequency
- SI unit: rad/s

**Relation between linear and angular velocity:**
v = rω (where r is the radius)

**Centripetal Acceleration:**
a_c = v²/r = rω²

Direction: Always directed toward the center of the circular path

**Centripetal Force:**
F_c = mv²/r = mrω²

### Important Points
1. Speed is constant but velocity changes (direction changes continuously)
2. Acceleration is always perpendicular to velocity, directed toward center
3. Work done by centripetal force is zero (force ⊥ displacement)
4. The magnitude of acceleration = v²/r (constant for uniform circular motion)

### Non-uniform Circular Motion
When speed changes along with direction:
- Tangential acceleration: aₜ = dv/dt (changes speed)
- Centripetal acceleration: aₙ = v²/r (changes direction)
- Net acceleration: a = √(aₜ² + aₙ²)

---

## 11. Important Problem-Solving Tips for JEE

1. **Choose coordinate system wisely**: Take the direction of initial velocity as positive
2. **Break vectors into components**: Resolve velocities and accelerations along x and y axes
3. **Use sign convention consistently**: Common: upward positive, rightward positive
4. **For projectile problems**: Horizontal and vertical motions are independent
5. **For relative motion**: Always define whose frame you're working in
6. **Check units**: Ensure all quantities are in SI units before substituting
7. **Draw diagrams**: Always draw the motion diagram before solving
8. **Time is common**: In projectile motion, time connects horizontal and vertical equations

### Common Mistakes to Avoid
- Confusing distance with displacement
- Forgetting that velocity can be negative
- Using equations of motion when acceleration is not constant
- Ignoring the vector nature of velocity and acceleration
- Not considering sign conventions in problems with gravity
