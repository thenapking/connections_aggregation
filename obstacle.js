class Obstacle {
  constructor(position, radius, group, agent) {
    this.position = position;
    this.radius = radius;
    this.group = group;
    this.agent = agent;
  }

  draw() {
    fill(stroke_colour);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }

}

let RSF = 0.3
function create_obstacles() {

  for (let i = 0; i < NUM_OBSTACLES; i++) {
    let x = random(w);
    let y = random(h);
    let sf = 0.025
    let nz = noise(sf*x, sf*y)
    let r = map(nz, 0, 1, 8, 16)
    let intersects = false


    for(let other of emitters){
      let d = dist(x, y, other.position.x, other.position.y);
      if(d < r*r*RSF + other.radius){
        intersects = true;
        break;
      }
    }

    if(intersects){ continue; }

    for(let other of obstacles){
      let d = dist(x, y, other.position.x, other.position.y);
      if(d < r*r*RSF + other.radius){
        intersects = true;
        break;
      }
    }

    if(intersects){ continue; }
    obstacles.push(new Obstacle(createVector(x, y), r));
  }
}

function add_obstacles_to_grid(){
  obstacles_grid = new Grid();
  for(let obstacle of obstacles){
    obstacles_grid.add(obstacle);
  }
  
  
}
