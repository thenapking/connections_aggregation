class Emitter {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = EMITTER_MARGIN
  }

  draw() {
    let palette_idx = palette.groups[2][1];
    let c = palette.colours[palette_idx];
    fill(c);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}

function create_emitters(width, height) {
  while(emitters.length < NUM_EMITTERS){
    let x = constrain(randomGaussian(width/2, width/5), 0, width);
    let y = constrain(randomGaussian(height/2, height/5), 0, height);
    console.log(x, y);
    let intersecting = false;

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
    
    if(!intersecting) {
      emitters.push(new Emitter(x, y));
    }
  }

  for(let emitter of emitters){
    let attractor = new Attractor(emitter.position.x, emitter.position.y, 2);
    attractors.push(attractor);
    
  }
}

