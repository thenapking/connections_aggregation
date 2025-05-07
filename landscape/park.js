class Park {
  constructor(position, radius) {
    this.position = position;
    this.radius = radius;
    this.points = [];
    this.hatch_angle = radians(random([45, -45]));
    this.hatch_interval = 6;
    this.initialize();
    this.hatching = [];
  }

  initialize() {
    let n = int(round(random(5, 8)));
    let distance = 0;
    for (let i = 0; i < n; i++) {
      let t = map(i, 0, n, 0, TWO_PI);
      let rx = random(0.10, 0.25) * w*u
      let ry = random(0.10, 0.25) * w*u
      let x = this.position.x + rx * cos(t);
      let y = this.position.y + ry * sin(t);
      let d = dist(this.position.x, this.position.y, x, y);
      if( d > distance){ distance = d }
      this.points.push(createVector(x, y));
    }
    this.radius = distance;
  }

  valid(){
    if(below_water_level(this.position)){
      return false;
    }

    for (let p of this.points) {
      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
        return false;
      }
      if(below_water_level(p)){
        return false;
      }
    }

    for(let other of parks){
      if(this.inside(other.position, other.radius, PARK_MARGIN)) { return false }
    }
    return true;
  }

  inside(other_position, other_radius, margin = 0){
    let d = dist(this.position.x, this.position.y, other_position.x, other_position.y);
    return d < this.radius + other_radius + margin;
  }

  draw() {
    paper.stroke(paper_palette.background);
    paper.strokeWeight(30);
    paper.fill(paper_palette.background)
    paper.beginShape();
    paper.curveVertex(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
    for (let p of this.points) {
      paper.curveVertex(p.x, p.y);
    }
    paper.curveVertex(this.points[0].x, this.points[0].y);
    paper.curveVertex(this.points[1].x, this.points[1].y);
    paper.endShape();
  }

  draw_hatching(){
    paper.noFill();
    paper.stroke(paper_palette.black);
    paper.strokeWeight(1);
    for (let i = 0; i < this.hatching.length; i += 2) {
      let x1 = this.hatching[i].x, y1 = this.hatching[i].y;
      let x2 = this.hatching[i+1].x, y2 = this.hatching[i+1].y;
      if(below_water_level(createVector(x1, y1))){
        paper.circle(x1, y1, 5);
      }
      if(below_water_level(createVector(x2, y2))){
        paper.circle(x2, y2, 5);
      }
      paper.line(x1, y1, x2, y2);
    }
  }
  
  hatch(){
    if(this.points.length < 3){ return [] }

    const cx = hatchBuffer.width / 2;
    const cy = hatchBuffer.height / 2;
    const hbh = hatchBuffer.height;
    const hbw = hatchBuffer.width;
  
    hatchBuffer.noSmooth();
    
    // 1. Draw a rotated version of the shape into the offscreen buffer.
    hatchBuffer.background(0);
    hatchBuffer.noStroke();
    
    hatchBuffer.push();
      // DOES NOT WORK WITH THE U SCALING
      // hatchBuffer.translate(cx, cy);
      // hatchBuffer.rotate(this.hatch_angle);
      // hatchBuffer.translate(-cx, -cy);
    
      hatchBuffer.push();
        // hatchBuffer.translate(w/2, h/2);
        
        // Draw outer shape in white.
        hatchBuffer.fill(255);
        hatchBuffer.beginShape();
        hatchBuffer.curveVertex(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
  
        for (let p of this.points) {
          hatchBuffer.curveVertex(p.x, p.y);
        }
        hatchBuffer.curveVertex(this.points[0].x, this.points[0].y);
        hatchBuffer.curveVertex(this.points[1].x, this.points[1].y);
        hatchBuffer.endShape(CLOSE);
      hatchBuffer.pop();
    hatchBuffer.pop();
    
    // 2. Compute hatch lines by scanning pixels.
    let hatching = [];
    hatchBuffer.loadPixels();
    for (let y = 0; y < hbh; y += this.hatch_interval) {
      let row = y * hbw;
      let bActive = false;
      let prevR = 0;
      for (let x = 0; x < hbw; x++) {
        let index = (row + x) * 4;
        let currR = hatchBuffer.pixels[index]; // red channel
        if (x === hbw - 1) {
          if (bActive) {
            hatching.push(createVector(x, y));
            bActive = false;
          }
        } else {
          if (currR >= 128 && prevR < 128) {
            hatching.push(createVector(x + 1, y));
            bActive = true;
          } else if (currR < 128 && prevR >= 128 && bActive) {
            hatching.push(createVector(x - 1, y));
            bActive = false;
          }
        }
        prevR = currR;
      }
    }
    
    // 3. Un-rotate the hatch lines back into canvas space.

    // THIS DOES NOT WORK WITH THE U SCALING
    // for (let i = 0; i < hatching.length; i += 2) {
    //   let st = hatching[i];
    //   let en = hatching[i+1];
    //   let sxo = st.x - cx;
    //   let syo = st.y - cy;
    //   let sxr = sxo * cos(-this.hatch_angle) - syo * sin(-this.hatch_angle) + cx;
    //   let syr = syo * cos(-this.hatch_angle) + sxo * sin(-this.hatch_angle) + cy;
    //   let exo = en.x - cx;
    //   let eyo = en.y - cy;
    //   let exr = exo * cos(-this.hatch_angle) - eyo * sin(-this.hatch_angle) + cx;
    //   let eyr = eyo * cos(-this.hatch_angle) + exo * sin(-this.hatch_angle) + cy;
    //   hatching[i].set(sxr, syr);
    //   hatching[i+1].set(exr, eyr);
    // }

    // for (let i = 0; i < hatching.length; i++) {
    //   let px = hatching[i].x - w/2;
    //   let py = hatching[i].y - h/2;
    //   hatching[i].set(px, py);
    // }

    return hatching
  }

  post_hatching_validity(){
    if(this.hatching.length < 2){ return false }

    for (let i = 0; i < this.hatching.length; i++) {
      let p = this.hatching[i];
      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
        return false;
      }
      if(below_water_level(p)){
        return false;
      }
    }
    return true;
  }
  
}

let parks = [];

function create_parks(){
  const MAX_ATTEMPTS = 1000;
  let attempts = 0;
  let park_count = int(round(random(3, 6)));
  while (parks.length < park_count && attempts < MAX_ATTEMPTS) {
    let position = createVector(random(0, w), random(0, h));
    let radius = random(0.05, 0.15) * w;
    let park = new Park(position, radius);
    

    if (park.valid()) {
      park.hatching = park.hatch(); 
    }

    if(park.post_hatching_validity()){
      parks.push(park);
    } else {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        break;
      }
    }
  }
}


