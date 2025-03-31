class Emitter {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 10;
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
    let x = random(width);
    let y = random(height);
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
      if(d < other.radius + OBSTACLE_MARGIN){
        intersecting = true;
        break;
      }
    }
    if(!intersecting) {
      emitters.push(new Emitter(x, y));
    }
  }
}

function create_agents(){
  for (let emitter of emitters) {
    for (let i = 0; i < NUM_AGENTS; i++) {
      agents.push(new Agent(emitter.position.x, emitter.position.y, emitter));
    }
  }
}
