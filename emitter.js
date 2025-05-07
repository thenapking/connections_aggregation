class Emitter {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 5
    this.attractor = null;
    this.hotspot = null;
  }

  attach_hotspot() {
    let nearest  = null;
    let nearest_dist = Infinity;

    for(let hotspot of hotspots) {
      let d = p5.Vector.dist(hotspot.position, this.position);
      if (d < nearest_dist) {
        nearest_dist = d;
        nearest = hotspot;
        if(d < hotspot.nearest_emitter_distance){
          hotspot.nearest_emitter_distance = d;
        }
      }
    }

    if(nearest_dist > EMITTER_MARGIN){ return; }

    nearest.emitter = this;
    this.hotspot = nearest;
    
    let moving_closer = false;

    for(let other of emitters){
      if(other == this) continue;
      let d1 = p5.Vector.dist(other.position, nearest.position);
      let d2 = p5.Vector.dist(other.position, this.position);
      if (d1 < EMITTER_MARGIN && d1 < d2) {
        moving_closer = true;
        break;
      }
    }

    if(!moving_closer){
      this.position = nearest.position.copy();
      if(nearest.major && this.attractor){
        this.attractor.radius = 20;
      } else {
        this.attractor.radius = 2;
      }
    }
  }

  draw() {
    let palette_idx = palette.groups[2][1];
    let c = palette.colours[palette_idx];
    fill(c);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}

function attach_emitters(){
  for(let emitter of emitters){
    emitter.attach_hotspot();
  }
}

function create_hotspot_emitters(){
  for(let hotspot of hotspots){
    hotspot.create_emitter();
  }
}

function create_emitters(width, height) {
  let MAX_ATTEMPTS = 1000;
  let attempts = 0;
  while(emitters.length < NUM_EMITTERS && attempts < MAX_ATTEMPTS){
    let x = constrain(randomGaussian(width/2, width/5),   EMITTER_MARGIN, width - EMITTER_MARGIN);
    let y = constrain(randomGaussian(height/2, height/5), EMITTER_MARGIN, height - EMITTER_MARGIN);
    
    if(below_water_level(createVector(x,y))){ continue; }

    let intersecting = false;

    for(let park of parks){
      if(park.inside(createVector(x, y), 0, 10)){
        intersecting = true;
        break;
      }
    }

    for(let other of emitters){
      let d = p5.Vector.dist(createVector(x, y), other.position);
      if(d < other.radius + EMITTER_MARGIN){
        intersecting = true;
        break;
      }
    }

    for(let other of obstacles){
      let d = p5.Vector.dist(createVector(x, y), other.position);
      if(d < other.radius*2 + OBSTACLE_MARGIN){
        other.group.remove_agent(other.agent);
        break;
      }
    }
    
    if(!intersecting){ 
      emitters.push(new Emitter(x, y));
    }
    attempts++;
  }


  for(let emitter of emitters){
    let attractor = new Attractor(emitter.position.x, emitter.position.y, 2);
    emitter.attractor = attractor;
    attractors.push(attractor);

  }
}

function create_emitters_from_foodlayer(){
  foodLayer.loadPixels();
  for (let i = 0; i < foodLayer.pixels.length; i+=4) {
    let r = foodLayer.pixels[i];
   
    if(r == 200){
      let x = (i / 4) % foodLayer.width;
      let y = Math.floor((i / 4) / foodLayer.width);
      let new_position = createVector(x, y);

      if(x < EMITTER_MARGIN || y < EMITTER_MARGIN){ continue; }
      if(x > w - EMITTER_MARGIN || y > h - EMITTER_MARGIN){ continue; }
      if(below_water_level(new_position)){ continue; }

      let intersecting = false;
      for(let park of parks){
        if(park.inside(createVector(x, y), 0, 0)){
          intersecting = true;
          break;
        }
      }

      if(intersecting){ continue; }

      let nearest_distance = Infinity;
      if(x > w || y > h){ continue; }

      for(let other of emitters){
        let d = p5.Vector.dist(new_position, other.position);
        if(d < nearest_distance){
          nearest_distance = d;
        }
      }

      if(nearest_distance > EMITTER_MARGIN * 2){
        let emitter = new Emitter(x, y)
        let attractor = new Attractor(x, y, 2);

        emitters.push(emitter);
        emitter.attractor = attractor;
      }
    }
  }
}

function remove_emitters(){
  for(let emitter of emitters){
    if(below_water_level(emitter.position)){
      if(emitter.hotspot){
        emitter.hotspot.emitter = null;
      }

      let index = emitters.indexOf(emitter);
      if(index > -1) {
        emitters.splice(index, 1);
      }
    }
  }
}



