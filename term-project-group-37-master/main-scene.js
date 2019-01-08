class GameObject {
    constructor(prim, rad, mat, tex, id){
        this.shape = prim;
        this.radius = rad;
        this.matrix = mat;
        this.texture = tex;
        this.identity = id;
        this.velocity = 0;
    }
}

window.Moove_Scene = window.classes.Moove_Scene =
class Moove_Scene extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:

        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 
          
        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,10 ), Vec.of( 0,2,0 ), Vec.of( 0,1,0 ) );
        
        this.moo_audio = new Audio('/assets/moo.wav');
        this.crunch_audio = new Audio('/assets/crunch.wav');
        this.ouch_audio = new Audio('/assets/ouch2.mp3');
        this.death_audio = new Audio('/assets/death.wav');
        this.win_audio = new Audio('/assets/yay.mp3');

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        document.getElementById('size').style.opacity =  0;
        document.getElementById('health').style.opacity =  0;
        document.getElementById('status').style.opacity =  0;
        document.getElementById('win').style.opacity =  0;

        const shapes = { box:   new Cube(),
                         box_2: new Cube(),
                         ball: new Subdivision_Sphere(4),
                         shoe: new Shape_From_File( "/assets/shoe.obj" ),
                         polytree: new Shape_From_File("/assets/polytree.obj" ),
                         apple: new Shape_From_File("/assets/apple.obj"),
                         lotus: new Shape_From_File("/assets/lotus.obj"),
                         cow: new Shape_From_File("/assets/cow.obj")                 
                       }
                            
        shapes.box_2.texture_coords = [ Vec.of(0,0), Vec.of(3,0), Vec.of(0,3), Vec.of(3,3),
                                        Vec.of(0,0), Vec.of(3,0), Vec.of(0,3), Vec.of(3,3),
                                        Vec.of(0,0), Vec.of(3,0), Vec.of(0,3), Vec.of(3,3),
                                        Vec.of(0,0), Vec.of(3,0), Vec.of(0,3), Vec.of(3,3),
                                        Vec.of(0,0), Vec.of(3,0), Vec.of(0,3), Vec.of(3,3),
                                        Vec.of(0,0), Vec.of(3,0), Vec.of(0,3), Vec.of(3,3),
                                        Vec.of(0,0), Vec.of(3,0), Vec.of(0,3), Vec.of(3,3)];
    

        this.submit_shapes( context, shapes );

          
        this.materials =
          {
            //Change ambient to 1 for Fake_Bump_Map

            polytree: context.get_instance(Phong_Shader).material( Color.of(0.3,0.7,0,1),{ ambient: .5, diffusivity: .5, specularity: 0 } ),
                         
            //food:///////////////////////////////////////////////////////////////////////////////
            apple: context.get_instance(Phong_Shader).material( Color.of( 0.5,0,0,1 ),      
                   {ambient: 0.5, diffusivity: .5, specularity: .5, texture: context.get_instance( "/assets/appleD.jpg" )}),
            
            lotus: context.get_instance(Phong_Shader).material( Color.of( 0.5,0,0,1 ),      
                   {ambient: 0.5, diffusivity: .5, specularity: .5, texture: context.get_instance( "/assets/flower.jpg" )}),
            
            ////////////////////////////////////////////////////////////////////////////////////

            //texture that looks alright:///////////////////////////////////////////////////////////

            //used for ball at start of game
            brick: context.get_instance( Fake_Bump_Map ).material( Color.of( 1,1,1,1 ), { ambient: .2, diffusivity: .5, specularity: .3, smoothness: 10, texture: context.get_instance( "/assets/wood.jpg" ) } ),
            stopped: context.get_instance( Phong_Shader ).material( Color.of(0,0,0,1), {texture: context.get_instance("assets/texture1.png", false), ambient: 0.8 }),
            cow:context.get_instance( Fake_Bump_Map ).material( Color.of( 0.8,0.5,0,1 ), { ambient: .2, diffusivity: .5, specularity: .3, smoothness: 10, texture: context.get_instance( "/assets/brownfur.jpg" ) } ),
            
            //using now for cubes
            brickwall: context.get_instance( Texture_Scroll_X ).material( Color.of( 0,0,0,1 ), {ambient:1, diffusivity:0.7, specularity: 0.3, texture: context.get_instance("assets/brickwall.jpg", true)} ),
            wood: context.get_instance( Phong_Shader ).material( Color.of(0,0,0,1), {texture: context.get_instance("assets/wood.jpg", false), ambient: .8, diffusivity: .5, specularity: .5 }),
            bump_block: context.get_instance(Bump_Shader).material(Color.of(0,0,0,1), {texture: context.get_instance("assets/flower.jpg", true), texture2: context.get_instance("assets/bumpmap.jpg", true), ambient: 1, specularity: 0}),

            //using to build scene
            nightsky: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {texture: context.get_instance("assets/stars.jpg", false), ambient: 1}),
            skybox: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {texture: context.get_instance("assets/skybox.jpg", false), ambient: 1}),
            greengrass: context.get_instance(Bump_Shader).material(Color.of(0,0,0,1), {texture: context.get_instance("assets/grass.jpg", true), texture2: context.get_instance("assets/bumpmap.jpg", true), ambient: 1, specularity: 0}),
          }
        
        this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 1,1,1,1 ), 10000  ) ];

        this.ball = Mat4.identity();
        this.acceleration = -9.81;

        //Scene Components:
        const plane_length = this.plane_length = 20;
        const plane_length_multiplier = this.plane_length_multiplier = 10;
        const plane_width = this.plane_width = 22;
        const plane_height = this.plane_height = 0.1;


        //Model transforms used on ball
        this.rolling_matrix = Mat4.identity();
        this.rotation_matrix2 = Mat4.identity();
        this.rotation_matrix1 = Mat4.identity();
        this.current_material = this.materials.brick;
        this.radius = 1;

        this.score = 0;
        this.health = 3;
        document.getElementById('status').innerHTML = "Score: " + this.score;

        this.objects_array = [];
        this.forest = [];
        this.index = -1;

        //Generate random number within bounds of plane
        var limit = 50, //try generating 10 numbers first
            lower_bound_x = 1,
            lower_bound_z = 5,
            lower_bound_y = 8,
            upper_bound_x = this.plane_width-5,
            upper_bound_z = 2*this.plane_length * this.plane_length_multiplier,
            upper_bound_y = 30,
            unique_random_coordinates = [];
        
        function arrayEquals(arr1, arr2) {
          if(arr1.length !== arr2.length) {
              return false;
          }
          for(var i = arr1.length; i--;) {
              if(arr1[i] !== arr2[i]) {
                  return false;
              }
          }
          return true;
        }

        function isCoordinateInArray(coordinate, arr) {
          for (var i = 0; i < arr.length; i++) {
            if(coordinate[1] == arr[1]) {
              return false;
            }
          }
          return true;
        }
        
        while (unique_random_coordinates.length < limit){
            let random_x = Math.floor(Math.random()*(upper_bound_x - lower_bound_x) + lower_bound_x);
            let random_z = Math.floor(Math.random()*(upper_bound_z - lower_bound_z) + lower_bound_z);
            let random_coordinate = [random_x, random_z]

            if (isCoordinateInArray(random_coordinate, unique_random_coordinates)) { 
              //new random coordinate
              unique_random_coordinates.push(random_coordinate);
            }
        }
                
        //Build and distribute game objects across plane
        for (var i = 0; i < unique_random_coordinates.length ; i++){
         

         let random = Math.floor(Math.random() * Math.floor(10));
         let tex_random = Math.floor(Math.random() * Math.floor(4));
         

         if (random < 2)
            this.objects_array[i]= new GameObject(this.assign_shape(random), 1, Mat4.identity(),this.get_texture_food(random), "food");
         else if (random == 4 || random == 6)
            this.objects_array[i] = new GameObject(this.shapes.cow, 1, Mat4.identity(), this.materials.cow, "cow");
         else if ((random == 3) || (random == 5)){
            this.objects_array[i] = new GameObject(this.shapes.shoe, 1, Mat4.identity(),this.materials.stopped, "enemy");
         } else 
            this.objects_array[i] = new GameObject(this.shapes.box, 1, Mat4.identity(),this.get_texture_cubes(tex_random), "box"); 

         let left = -1;
         if (unique_random_coordinates[i][0] % 2 == 0)
            left *= -1;  
        
         if (unique_random_coordinates[i][1] % 3 == 0){
           
           let polytree_transform = Mat4.identity();
           polytree_transform = polytree_transform.times(Mat4.translation([ left*(this.plane_width-2), 2, -(unique_random_coordinates[i][1]-5)]));
                                                     
           this.forest.push(polytree_transform);   
         }        

         if (this.objects_array[i].identity == "food")
         {

          this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation([0, 0.6, 0])); 
         }
            
         if(this.objects_array[i].identity == "enemy") { 
          this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation([
            left*unique_random_coordinates[i][0], 
            0, 
            -(unique_random_coordinates[i][1])
           ])); 
         }
         else { //everything except enemy drops from sky
          this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation([
            left*unique_random_coordinates[i][0], 
            Math.floor(Math.random()*(upper_bound_y - lower_bound_y) + lower_bound_y), 
            -(unique_random_coordinates[i][1])
           ])); 
         }
        }

        this.skybox = [];
        this.start_flag = false;

        for (var i = 0; i < 6; i++)
        {
          let temp = Mat4.identity();
          this.skybox[i] = temp;
        }
        
        let sky_scale = 500;
        let translate_up = 400;
        
        //top
        this.skybox[0] = this.skybox[0].times(Mat4.translation([0, translate_up ,0]))
                                       .times(Mat4.scale([sky_scale,0.1,sky_scale]));

        //right
        this.skybox[1] = this.skybox[1].times(Mat4.translation([sky_scale, translate_up-sky_scale,0]))
                                      .times(Mat4.scale([0.1,sky_scale,sky_scale]));    

        //back
        this.skybox[2] = this.skybox[2].times(Mat4.translation([0, translate_up-sky_scale,-sky_scale]))
                                       .times(Mat4.scale([sky_scale,sky_scale,0.1]));
        //bottom
        this.skybox[3] = this.skybox[3].times(Mat4.translation([0, translate_up-2*sky_scale,0]))
                                       .times(Mat4.scale([sky_scale,0.1,sky_scale]) );

        //left
        this.skybox[4] = this.skybox[4].times(Mat4.translation([-sky_scale, translate_up-sky_scale,0]))
                                       .times(Mat4.scale([0.1,sky_scale,sky_scale]));

        //front
        this.skybox[5] = this.skybox[5].times(Mat4.translation([0, translate_up-sky_scale,sky_scale]))
                                       .times(Mat4.scale([sky_scale,sky_scale,0.1]));

        this.size_flag = false;
        this.collide_count = 0;
        this.pull_back = 0;
        this.plane_drop = -1;
      }        
    
    win_game(z_coord){
        if (z_coord <= -395)
           return true;
        return false;
    }

    assign_shape(index){

        switch(index)
        {
          case 0: return this.shapes.lotus; break;
          case 1: return this.shapes.apple; break;
          default: return this.shapes.box; break;
        }

    }

    get_texture_food(index){
       switch(index)
        {
        case 0: return this.materials.lotus; break;
        case 1: return this.materials.apple; break;
        }

    }
    
    get_texture_cubes(index){
        switch (index){
        case 0: return this.materials.brick; break; 
        case 1: return this.materials.wood; break;
        case 2: return this.materials.brickwall; break;
        case 3: return this.materials.bump_block; break;
        default: return this.materials.skybox; break;
        }
    }

    set_sizeflag(game_object){
       if(game_object.identity == "food"){ 
           this.size_flag = true;
           this.collide_count += 1;
           return true;     
       }
       return false;
    }

    adjust_camera(){

        if (this.collide_count > 3)
            return true;
        
        return false;
    }

    restart_game(){
        window.location.reload();
    }
    
    start_game(){
        document.getElementById('size').style.opacity =  1;
        document.getElementById('health').style.opacity =  1;
        document.getElementById('status').style.opacity =  1;
        this.start_flag = true;
        var op = 1;  // initial opacity
        var timer = setInterval(function () {
          if (op <= 0.1){
              clearInterval(timer);
              document.getElementById('landing').style.display = 'none';
          }
          document.getElementById('landing').style.opacity = op;
          document.getElementById('landing').style.filter = 'alpha(opacity=' + op * 100 + ")";
          op -= op * 0.1;
        }, 50);
    
    }

    make_control_panel(){
      this.key_triggered_button( "Forward", [ "i" ], () => {
                this.c_flag = true; 
      }, "#FFA500",() => {this.c_flag = false;});

      this.key_triggered_button( "Backward", [ "k" ], () => {
                this.x_flag = true; 
      }, "#00FFFF",() => {this.x_flag = false;});

      this.key_triggered_button( "Left", [ "j" ], () => {
                this.a_flag = true; 
      }, "#00FF00",() => {this.a_flag = false;});

      this.key_triggered_button( "Right", [ "l" ], () => {
                this.d_flag = true; 
      }, "#FF00FF",() => {this.d_flag = false;});

      this.key_triggered_button( "Start", [ "c" ], () => {
                this.start_game();
      }, "#db236f",() => {});
      this.key_triggered_button( "Restart", [ "r" ], () => {
                this.restart_game();
      }, "#aadb23",() => {});
      }

    display( graphics_state )
      {   
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;    

        if (this.health == 0){
            this.death_audio.play();
            document.getElementById('win').innerHTML = "You died! Try again!";
            document.getElementById('win').style.opacity = 1;
            this.restart_game();
        }
        else if (this.win_game(this.ball[2][3])){
            this.win_audio.play();
            document.getElementById('win').style.opacity =  1;
            let desired = Mat4.identity();
            desired = desired.times(Mat4.translation([0,0,-510 ]));
            this.lights = [ new Light( Vec.of( desired[0][3],desired[1][3]+8,desired[2][3], 1 ), Color.of( 1,1,1,1 ), 100000  ) ];
            graphics_state.lights = this.lights; 
            desired = Mat4.inverse(desired);
            desired = desired.map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 0.6 ));
            graphics_state.camera_transform = desired;
        }
            
        
        //Draw skybox
        for (var i = 0; i < this.skybox.length; i++)
          this.shapes.box.draw(graphics_state,this.skybox[i],this.materials.skybox);

        let night_transform = Mat4.identity();
        night_transform = night_transform.times(Mat4.translation([0,0,-600]))
                                         .times(Mat4.scale([100,50,0.1]));

        this.shapes.box.draw(graphics_state,night_transform,this.materials.nightsky);


        this.ball = Mat4.identity();
       
        //Controls rolling movement of ball
        if (this.c_flag){
            
            this.rotation_matrix1 = this.rotation_matrix1.times(Mat4.rotation((10 * dt), (Vec.of(-1,0,0))));
            this.rolling_matrix = this.rolling_matrix.times(Mat4.translation(([0,0,-(14* dt)])));
        }   
        else if (this.x_flag){
            this.rotation_matrix1 = this.rotation_matrix1.times(Mat4.rotation((10 * dt), (Vec.of(1,0,0))));
            this.rolling_matrix = this.rolling_matrix.times(Mat4.translation(([0,0,(14 * dt)])));
        }  
        else if (this.a_flag){

            this.rotation_matrix2 = this.rotation_matrix2.times(Mat4.rotation((10 * dt), (Vec.of(0,0,1))));
            
            if (! (this.rolling_matrix[0][3] < -(this.plane_width-2)) )
                this.rolling_matrix = this.rolling_matrix.times(Mat4.translation(([-(14 * dt),0,0])));

                this.rotation_matrix2 = this.rotation_matrix2.times(Mat4.rotation((10 * dt), (Vec.of(0,0,1))));
                
        }  
        else if (this.d_flag){

            this.rotation_matrix2 = this.rotation_matrix2.times(Mat4.rotation((10 * dt), (Vec.of(0,0,-1))));

            if ( ! (this.rolling_matrix[0][3] > this.plane_width-2) )
                this.rolling_matrix = this.rolling_matrix.times(Mat4.translation(([(14 * dt),0,0])));
            
        }
        this.ball = this.ball.times(this.rolling_matrix);

        if (this.c_flag || this.x_flag) {
           this.ball = this.ball.times(this.rotation_matrix1);
        }
        else if (this.a_flag || this.d_flag) {
           this.ball = this.ball.times(this.rotation_matrix2);
        }

       
       //Detect if collision occurs between ball and game objects
        for (var i = 0; i < this.objects_array.length; i++){
             if(((Math.abs(this.ball[0][3] - this.objects_array[i].matrix[0][3]) < (this.radius + this.objects_array[i].radius)) &&
                 (Math.abs(this.ball[1][3] - this.objects_array[i].matrix[1][3]) < (this.radius + this.objects_array[i].radius)) &&
                 (Math.abs(this.ball[2][3] - this.objects_array[i].matrix[2][3]) < (this.radius + this.objects_array[i].radius)))){
   
                    if (this.objects_array[i].identity == "enemy"){
                      this.ouch_audio.play();
                      this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation([0,150,0]));//move collided object underneath the plane
                      this.health--;
                      document.getElementById('health').innerHTML = "Health: " + this.health; //decrease health when touched an enemy


                    } else if (this.objects_array[i].identity == "cow"){
                      this.moo_audio.play();
                      this.index = i;
                      this.score += 1;
                      document.getElementById('status').innerHTML = "Score: " + this.score; //increase score when touch cow

                    } else if (this.objects_array[i].identity == "food"){
                        this.crunch_audio.play();
                        this.set_sizeflag(this.objects_array[i]); //increase size of ball when eat food
                        this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation([0,150,0]));//move collided object underneath the plane
                        this.score += 1;
                        document.getElementById('status').innerHTML = "Score: " + this.score; //increase score when eat food

                    } else {
                      this.current_material = this.objects_array[i].texture; 
                      this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation([0,150,0])); //move collided object underneath the plane
                    }
                                
            }
        }

        var movement = 0.2 * (Math.sin(t * 0.5));

        if (this.objects_array[this.index]){
            if ((this.index != -1) && (this.objects_array[this.index].identity == "cow")){
                this.objects_array[this.index].matrix = this.objects_array[this.index].matrix.times(Mat4.translation([movement, 0,0]))
                                                                                             .times(Mat4.rotation(movement, Vec.of(0,1,0)));
            }
        }
         if (this.size_flag){

            this.radius += 0.5;
            document.getElementById('size').innerHTML = "Radius: " + this.radius;
            this.plane_drop -= 0.5;

            for (var i = 0; i < this.objects_array.length; i++)
                this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation( [0, -0.5, 0] ));
            
                        
            this.size_flag = false;           

        }
        else if (this.radius == 1){
            this.plane_drop = -1;

        }
       
        //Building the plane
        this.plane = Mat4.identity();        
        
        
        let move_tile = 0;
        for (var i = 0; i <= this.plane_length_multiplier+1; i++)
        {
          let sink_plane = this.plane.times(Mat4.translation( [0,this.plane_drop,move_tile] ))
                                   .times(Mat4.scale([this.plane_width, this.plane_height , this.plane_length] ));
           this.shapes.box_2.draw( graphics_state, sink_plane , this.materials.greengrass);    //draws the plane
           move_tile -= 2*this.plane_length;

        }

        //Then add polytrees on the side
        for (var i = 0; i < this.forest.length; i++)
        {
          let sink_tree = this.forest[i].times(Mat4.translation([0,this.plane_drop, 0]))
          this.shapes.polytree.draw(graphics_state,sink_tree, this.materials.polytree);
        }
    
        //Distribute game objects on plane
        if (this.start_flag){
            for (var i = 0; i < this.objects_array.length; i++){
                this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.scale([this.objects_array[i].radius, this.objects_array[i].radius, this.objects_array[i].radius] ) );
            //inertia bouncing
                this.objects_array[i].velocity += this.acceleration * dt;

                if (this.objects_array[i].matrix[1][3] < (this.plane_drop+1) && this.objects_array[i].velocity < 0) {
                    this.objects_array[i].velocity *= -.48;
                }
                if (this.objects_array[i].velocity < 0.01 && this.objects_array[i].matrix[1][3] < 0.01) {
                    this.objects_array[i].velocity = 0;
                }
          
            //control movement
                var movement2 = 0.4 * (Math.sin(t));
                if (this.objects_array[i].identity != "enemy"){ //if an obj is not an enemy, drop from sky
                    this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation(([0,this.objects_array[i].velocity * dt,0])));
                } else {
                    this.objects_array[i].matrix = this.objects_array[i].matrix.times(Mat4.translation([movement2,0,0]));
                }

                let food_adjust = this.objects_array[i].matrix.times(Mat4.rotation(Math.PI/4, Vec.of(1,0,0) ))
                                                          .times(Mat4.scale([0.3,0.3,0.3]));
                let enemy_adjust = this.objects_array[i].matrix.times(Mat4.scale([0.7,0.7,0.7]));
                let cow_adjust = this.objects_array[i].matrix.times(Mat4.translation([0,0.8,0])).times(Mat4.scale([1.3,1.3,1.3]));
            
                if (this.objects_array[i].identity == "food")
                    this.objects_array[i].shape.draw( graphics_state, food_adjust, this.objects_array[i].texture);
                else if (this.objects_array[i].identity == "enemy")
                    this.objects_array[i].shape.draw( graphics_state, enemy_adjust, this.objects_array[i].texture); 
                else if (this.objects_array[i].identity == "cow")
                    this.objects_array[i].shape.draw(graphics_state,cow_adjust,this.objects_array[i].texture);
                else
                    this.objects_array[i].shape.draw( graphics_state, this.objects_array[i].matrix, this.objects_array[i].texture);            
                }
        }

        let scale_ball = this.ball.times(Mat4.scale(Vec.of(1.0, 1.0, 1.0).times(this.radius) ));

        this.shapes.ball.draw( graphics_state, scale_ball, this.current_material);

          if ( this.adjust_camera() ){              
              this.pull_back += 4;
              this.collide_count = 0;
          }

          let desired = this.rolling_matrix.times(Mat4.translation([0,0,12 + this.pull_back ])).times(Mat4.translation([0,2,0]));
          this.lights = [ new Light( Vec.of( desired[0][3],desired[1][3]+8,desired[2][3], 1 ), Color.of( 1,1,1,1 ), 100000  ) ];
          graphics_state.lights = this.lights;  
          desired = Mat4.inverse(desired);
          desired = desired.map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 0.1 ));
          graphics_state.camera_transform = desired;

      }
  
  }


class Texture_Scroll_X extends Phong_Shader
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {
      return `
        uniform sampler2D texture;
        vec2 offset;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          
          vec4 tex_color = texture2D( texture, f_tex_coord );
          tex_color = texture2D(texture, f_tex_coord + vec2(mod(animation_time/8.0, 1.0), 0) ); 
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}


window.Fake_Bump_Map = window.classes.Fake_Bump_Map = 
class Fake_Bump_Map extends Phong_Shader                         // Same as Phong_Shader, except this adds one line of code.
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    { return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          
          vec4 tex_color = texture2D( texture, f_tex_coord );                    // Use texturing as well.
          vec3 bumped_N  = normalize( N + tex_color.rgb - .5*vec3(1,1,1) );      // Slightly disturb normals based on sampling
                                                                                 // the same image that was used for texturing.
                                                                                 
                                                                                 // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( bumped_N );                    // Compute the final color with contributions from lights.
        }`;
    }
}

window.Bump_Shader = window.classes.Bump_Shader =
class Bump_Shader extends Shader          // THE DEFAULT SHADER: This uses the Phong Reflection Model, with optional Gouraud shading. 
                                           // Wikipedia has good defintions for these concepts.  Subclasses of class Shader each store 
                                           // and manage a complete GPU program.  This particular one is a big "master shader" meant to 
                                           // handle all sorts of lighting situations in a configurable way. 
                                           // Phong Shading is the act of determining brightness of pixels via vector math.  It compares
                                           // the normal vector at that pixel to the vectors toward the camera and light sources.
          // *** How Shaders Work:
                                           // The "vertex_glsl_code" string below is code that is sent to the graphics card at runtime, 
                                           // where on each run it gets compiled and linked there.  Thereafter, all of your calls to draw 
                                           // shapes will launch the vertex shader program once per vertex in the shape (three times per 
                                           // triangle), sending results on to the next phase.  The purpose of this vertex shader program 
                                           // is to calculate the final resting place of vertices in screen coordinates; each vertex 
                                           // starts out in local object coordinates and then undergoes a matrix transform to get there.
                                           //
                                           // Likewise, the "fragment_glsl_code" string is used as the Fragment Shader program, which gets 
                                           // sent to the graphics card at runtime.  The fragment shader runs once all the vertices in a 
                                           // triangle / element finish their vertex shader programs, and thus have finished finding out 
                                           // where they land on the screen.  The fragment shader fills in (shades) every pixel (fragment) 
                                           // overlapping where the triangle landed.  It retrieves different values (such as vectors) that 
                                           // are stored at three extreme points of the triangle, and then interpolates the values weighted 
                                           // by the pixel's proximity to each extreme point, using them in formulas to determine color.
                                           // The fragment colors may or may not become final pixel colors; there could already be other 
                                           // triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the 
                                           // new triangle is closer to the camera, and even if so, blending settings may interpolate some 
                                           // of the old color into the result.  Finally, an image is displayed onscreen.
{ material( color, properties )     // Define an internal class "Material" that stores the standard settings found in Phong lighting.
  { return new class Material       // Possible properties: ambient, diffusivity, specularity, smoothness, gouraud, texture.
      { constructor( shader, color = Color.of( 0,0,0,1 ), ambient = 0, diffusivity = 1, specularity = 1, smoothness = 40 )
          { Object.assign( this, { shader, color, ambient, diffusivity, specularity, smoothness } );  // Assign defaults.
            Object.assign( this, properties );                                                        // Optionally override defaults.
          }
        override( properties )                      // Easily make temporary overridden versions of a base material, such as
          { const copied = new this.constructor();  // of a different color or diffusivity.  Use "opacity" to override only that.
            Object.assign( copied, this );
            Object.assign( copied, properties );
            copied.color = copied.color.copy();
            if( properties[ "opacity" ] != undefined ) copied.color[3] = properties[ "opacity" ];
            return copied;
          }
      }( this, color );
  }
  map_attribute_name_to_buffer_name( name )                  // We'll pull single entries out per vertex by field name.  Map
    {                                                        // those names onto the vertex array names we'll pull them from.
      return { object_space_pos: "positions", normal: "normals", tex_coord: "texture_coords" }[ name ]; }   // Use a simple lookup table.
  
   shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
        const int N_LIGHTS = 2;             // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];
        uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;               // Flags for alternate shading methods
        uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed from the vertex shader 
        varying vec2 f_tex_coord;             // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 L[N_LIGHTS], H[N_LIGHTS];
        varying float dist[N_LIGHTS];
        
        vec3 phong_model_lights( vec3 N, vec4 some_color )
          { vec3 result = vec3(0.0);
            for(int i = 0; i < N_LIGHTS; i++)
              {
                float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                float diffuse  =      max( dot(N, L[i]), 0.0 );
                float specular = pow( max( dot(N, H[i]), 0.0 ), smoothness );
                result += attenuation_multiplier * ( some_color.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
              }
            return result;
          }
        `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos, normal;
        attribute vec2 tex_coord;
        uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
        uniform mat3 inverse_transpose_modelview;
        
        //uniform vec3 T; // Tangent vector in object coordinates, ADDED tangent vector
        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);     // The vertex's final resting place (in NDCS).
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          f_tex_coord = tex_coord;                                         // Directly use original texture coords and interpolate between.
          
          if( COLOR_NORMALS )                                     // Bypass all lighting code if we're lighting up vertices some other way.
          { VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             // In "normals" mode, 
                                 N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],             // rgb color = xyz quantity.
                                 N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );     // Flash if it's negative.
            return;
          }
                                                  // The rest of this shader calculates some quantities that the Fragment shader will need:
          vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
          E = normalize( -screen_space_pos );
          //Bitangent Normal Vector B
          vec3 T = normalize(vec3(0,1,0));
          vec3 B = cross(N, T);
          B = normalize (B);
          
          mat3 TBN;
            
          for( int i = 0; i < 3; i++)
          {
            TBN[i] = vec3(T[i], B[i], N[i]);
          }
         
          for( int i = 0; i < N_LIGHTS; i++ )
          {            // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
            L[i] = normalize( TBN*( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * screen_space_pos );
            H[i] = normalize( L[i] + E );
            
            // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
            dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, screen_space_pos)
                                                : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
          }
          if( GOURAUD )                   // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader, 
          {                               // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed 
                                          // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
            VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
            VERTEX_COLOR.xyz += phong_model_lights( N, shapeColor );
          }
        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {                            // A fragment is a pixel that's overlapped by the current triangle.
                                 // Fragments affect the final image or get discarded due to depth.
      return `
        uniform sampler2D texture;
        uniform sampler2D texture2; //added second texture
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          
          vec2 coord;
          mat4 scale_mat = mat4(10, 0, 0, 0,
                                0, 10, 0, 0,
                                0, 0, 1, 0,
                                0, 0, 0, 1);
          
          coord = mod((scale_mat*(vec4(f_tex_coord, 0, 1))).xy, 1.0);
          vec4 tex_color = texture2D( texture, f_tex_coord );                         // Sample the texture image in the correct place.
          tex_color = texture2D(texture, coord);
                                                                                      // Compute an initial (ambient) color:
          
          vec3 bumped_N  = normalize(texture2D( texture2, f_tex_coord ).rgb - .5*vec3(1,1,1) );            //Deleted "N +", changed f_tex_coord to coord
          
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz = phong_model_lights( bumped_N, gl_FragColor );                     // Compute the final color with contributions from lights.
        }`;
    }

    // Define how to synchronize our JavaScript's variables to the GPU's:
  update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
    {                              // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
      this.update_matrices( g_state, model_transform, gpu, gl );
      gl.uniform1f ( gpu.animation_time_loc, g_state.animation_time / 1000 );

      if( g_state.gouraud === undefined ) { g_state.gouraud = g_state.color_normals = false; }    // Keep the flags seen by the shader 
      gl.uniform1i( gpu.GOURAUD_loc,        g_state.gouraud || material.gouraud );                // program up-to-date and make sure 
      gl.uniform1i( gpu.COLOR_NORMALS_loc,  g_state.color_normals );                              // they are declared.

      gl.uniform4fv( gpu.shapeColor_loc,     material.color       );    // Send the desired shape-wide material qualities 
      gl.uniform1f ( gpu.ambient_loc,        material.ambient     );    // to the graphics card, where they will tweak the
      gl.uniform1f ( gpu.diffusivity_loc,    material.diffusivity );    // Phong lighting formula.
      gl.uniform1f ( gpu.specularity_loc,    material.specularity );
      gl.uniform1f ( gpu.smoothness_loc,     material.smoothness  );

      if( material.texture )                           // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
      { gpu.shader_attributes["tex_coord"].enabled = true; 
        gl.uniform1f ( gpu.USE_TEXTURE_loc, 1 );
        gl.bindTexture( gl.TEXTURE_2D, material.texture.id );

         
        if( material.texture2) 
        {
            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i( gpu.texture2_loc, 1);
            gl.bindTexture( gl.TEXTURE_2D, material.texture2.id );
            gl.activeTexture(gl.TEXTURE0);
        }
        

      }
      else  { gl.uniform1f ( gpu.USE_TEXTURE_loc, 0 );   gpu.shader_attributes["tex_coord"].enabled = false; }

      if( !g_state.lights.length )  return;
      var lightPositions_flattened = [], lightColors_flattened = [], lightAttenuations_flattened = [];
      for( var i = 0; i < 4 * g_state.lights.length; i++ )
        { lightPositions_flattened                  .push( g_state.lights[ Math.floor(i/4) ].position[i%4] );
          lightColors_flattened                     .push( g_state.lights[ Math.floor(i/4) ].color[i%4] );
          lightAttenuations_flattened[ Math.floor(i/4) ] = g_state.lights[ Math.floor(i/4) ].attenuation;
        }
      gl.uniform4fv( gpu.lightPosition_loc,       lightPositions_flattened );
      gl.uniform4fv( gpu.lightColor_loc,          lightColors_flattened );
      gl.uniform1fv( gpu.attenuation_factor_loc,  lightAttenuations_flattened );
    }
  update_matrices( g_state, model_transform, gpu, gl )                                    // Helper function for sending matrices to GPU.
    {                                                   // (PCM will mean Projection * Camera * Model)
      let [ P, C, M ]    = [ g_state.projection_transform, g_state.camera_transform, model_transform ],
            CM     =      C.times(  M ),
            PCM    =      P.times( CM ),
            inv_CM = Mat4.inverse( CM ).sub_block([0,0], [3,3]);
                                                                  // Send the current matrices to the shader.  Go ahead and pre-compute
                                                                  // the products we'll need of the of the three special matrices and just
                                                                  // cache and send those.  They will be the same throughout this draw
                                                                  // call, and thus across each instance of the vertex shader.
                                                                  // Transpose them since the GPU expects matrices as column-major arrays.                                  
      gl.uniformMatrix4fv( gpu.camera_transform_loc,                  false, Mat.flatten_2D_to_1D(     C .transposed() ) );
      gl.uniformMatrix4fv( gpu.camera_model_transform_loc,            false, Mat.flatten_2D_to_1D(     CM.transposed() ) );
      gl.uniformMatrix4fv( gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(    PCM.transposed() ) );
      gl.uniformMatrix3fv( gpu.inverse_transpose_modelview_loc,       false, Mat.flatten_2D_to_1D( inv_CM              ) );       
    }
}

window.Sky_Shader = window.classes.Sky_Shader = 
class Sky_Shader extends Phong_Shader{

  fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {                            // A fragment is a pixel that's overlapped by the current triangle.
                                 // Fragments affect the final image or get discarded due to depth.
      return `
        uniform sampler2D texture;
        uniform sampler2D texture2; //added second texture
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          
          vec2 coord;
          mat4 scale_mat = mat4(0.5, 0, 0, 0,
                                0, 0.5, 0, 0,
                                0, 0, 1, 0,
                                0, 0, 0, 1);
          
          coord = mod((scale_mat*(vec4(f_tex_coord, 0, 1))).xy, 1.0);
          vec4 tex_color = texture2D( texture, f_tex_coord );                         // Sample the texture image in the correct place.
          tex_color = texture2D(texture, coord);
                                                                                      
          if( USE_TEXTURE && tex_color.w < .01 ) discard;   
                 
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); // Compute an initial (ambient) color:
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }

}

class Fake_Bump_Map extends Phong_Shader                         // Same as Phong_Shader, except this adds one line of code.
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    { return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          
          vec4 tex_color = texture2D( texture, f_tex_coord );                    // Use texturing as well.
          vec3 bumped_N  = normalize( N + tex_color.rgb - .5*vec3(1,1,1) );      // Slightly disturb normals based on sampling
                                                                                 // the same image that was used for texturing.
                                                                                 
                                                                                 // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( bumped_N );                    // Compute the final color with contributions from lights.
        }`;
    }
}


