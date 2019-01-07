# MOOve-It_WebGl-Game
Ball rolling game where ball changes appearance by colliding with different objects. Made with WebGl


What the project does: 
This project shows a ball the player controls with the keyboard. When it collides with a box, it picks up the texture of the box. The ball gets bigger by "eating" an apple or "picking up" a flower. The player earn points by eating an apple, picking up a flower, or interacting with a cow. Interacting with a cow causes the cow to start spinning with joy. The goal of the game is to reach the end of the path while racking up points without running out of health.

How to run: 
  Run "host.command" and open the browser to "localhost:8000" to run.

Advanced topics: Bump mapping, Texture mapping, Inertia

Who did what: 
  Stephanie- bump mapping, texture mapping, scene setup. 
  Carolyn: ball movement and keyboard controls, collision detection, gameplay aspects. 
  Benson: inertia, collision detection.

The project is built using Garret's library with some modification.

Mapping: 
Most game objects are mapped using either the "Fake_Bump_Map" class or the regular Phong Shader class to ensure performance. The grassy path in which all objects land on is mapped using bump mapping to give it a more defined look under the light source, which travels with the ball as it moves along the path. Bump mapping is done by passing tangents and bitangents to compute the TBN matrix. In the fragment shader, normals are distorted by passing in a second texture (a bump map). We also scaled the texture coordinate to not have the grass texture appeared too zoomed in.

Movement: 
Movement of the ball mainly depends on two matrices, one for translational motion and one for rotational motion. The translational and rotational motion are controlled by the player using the key i,k for forward and backward motion and j,k for leftward and rightward motion. We keep track of another independent matrix for the ball and apply the translational and rotational matrices depending on the key pressed by player.

Collision: 
Collision detection is determined by checking whether the difference between the coordinate of the ball and the coordinates of other game objects is smaller than the sum of the radius of the colliding bodies. The radius of our main ball starts off with a value of one. Since our other game objects, no matter what shape, are set to have a radius of 1 throughout the game.

Inertia: 
Inertia is implemented by multiplying the velocity of each object by the difference in time between each frame. Each object starts with zero velocity with a downward acceleration of 9.81 to mimick gravity. To prevent the objects' from fidgeting above the ground, we set the velocity to zero when the object is close to the ground. All objects except the trees on the side of the path and the shoes the ball should avoid start off falling from the sky. To mimick real physcis, the falling objects reverse direction when it touches the ground and loses velocity.
