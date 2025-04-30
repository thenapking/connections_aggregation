class Group {
  constructor(position, 
            fillColorIndex = 4,
            strokeColorIndex = 4,
            options = {},
    ) 
    {
    this.agents = [];
    this.branches = [];
    this.fillColorIndex = int(fillColorIndex);
    this.strokeColorIndex = int(strokeColorIndex);
    this.colourGroup = this.findColourGroup();

    this.lineStyle = options.lineStyle || "straight";

    this.bounds = options.bounds || { x: 0, y: 0, w: w, h: h };
    this.position = position.copy();
    
    this.minDistance = options.minDistance || int(random(30, 60))
    this.maxDistance = options.maxDistance || int(random(100, 300))
    this.minAgentDistance = options.minAgentDistance || int(this.minDistance / random([1, 2, 3, 4]));
    this.minAgentSize = options.minAgentSize;
    this.maxAgentSize = options.maxAgentSize;

    this.noiseScale = options.noiseScale;

    this.enableSeparation = options.enableSeparation;
    this.enableAlignment = options.enableAlignment;
    this.enableResize = options.enableResize;
    this.enableObstacles = !options.enableObstacles;
    
    this.minAgentDistance /= u;
    this.minDistance /= u;
    this.maxDistance /= u;
    this.minAgentSize /= u;
    this.maxAgentSize /= u;

    
    this.childN = options.childN || 1;
    this.childTheta = options.childTheta || PI / 6;
    this.childRadius = options.childRadius || random([5,7]);

    this.childRadius /= u;

    this.childoptions = {
      enable_separation: options.enableSeparation,
      enable_alignment: options.enableAlignment,
      enable_obstacles: options.enableObstacles,
      enable_resize: options.enableResize,
      noiseScale: options.noiseScale,
      minAgentSize: options.minAgentSize,
      maxAgentSize: options.maxAgentSize
    }

    this.separate = options.separate;

    this.show_branches = false; // options.showBranches;
    this.show_agents = options.showAgents;

    this.terminate_branches_early = options.terminateBranchesEarly;
    this.eccentricity = options.eccentricity;

    
    this.grid = new Grid();

    this.initialize(this.position, options);
    console.log(this);
    this.export();

    this.active = true;
  }

  

  initialize(position, options) {
    let direction = options.direction || random(TWO_PI);
    let rootTheta = options.rootTheta || random(PI/2, TWO_PI);
    let rootRadius = options.rootRadius || int(random(5, 10));
    rootRadius /= u;
    let rootN = options.rootN || 48;

    if(this.checkBounds(position)){
      let root = new Agent(position, direction, rootTheta, rootRadius, rootN, this, 0, this.childoptions);
      this.agents.push(root);
      let newbranches = root.spawn();
      this.branches.push(...newbranches);
      console.log("Branches created", this.branches.length);
    } else {
      console.log("Root agent out of bounds");
      return;
    }

    if(this.enableObstacles){
      let obstacle_size = options.obstacleSize || options.rootRadius;
      obstacle_size = constrain(obstacle_size, rootRadius, this.maxDistance);
      console.log(obstacle_size, options.obstacle_size, options.rootRadius, this.maxDistance)
      let obstacle = new Obstacle(this.position, obstacle_size, this);
      obstacles.push(obstacle);
      let attractor_size = options.obstacleSize || options.rootRadius;
      attractor_size = constrain(attractor_size * 3, rootRadius, this.maxDistance);
      let attractor = new Attractor(this.position.x, this.position.y, attractor_size)
      attractors.push(attractor);
    }

    if(this.enableSeparation || this.enableResize){
      for(let i=0; i< 500; i++){
        let x = position.x + random(-10, 10);
        let y = position.y + random(-10, 10);
        let agent = new Agent(createVector(x,y), direction, rootTheta, rootRadius, rootN, this, 0, this.childoptions);
        this.agents.push(agent);
        this.grid.add(agent);
      }
    }
  }

  findColourGroup(){
    for(let colour_group of palette.groups){
      if(colour_group.includes(this.fillColorIndex)){
        return colour_group;
      }
    }
  }

  update() {
    this.update_agents();
    this.update_branches();
  }

  update_branches(){
    for (let i = this.branches.length - 1; i >= 0; i--) {
      let branch = this.branches[i];
      branch.update();
      let new_position = branch.getEndPoint();

      if (branch.currentLength >= branch.minDistance && branch.currentLength <= branch.maxDistance) {
        if (this.canPlaceAgent(new_position, branch.parent) && !this.branchIntersects(branch, new_position)) {
          this.create_agent(branch, new_position, i);
          // if recursive also create a group.
          continue;
        }
      }

      if (branch.currentLength > branch.maxDistance) {
        this.branches.splice(i, 1);
      }
    }
  }

  update_agents(){
    // if(!this.active) { return; }
    let count = 0;
    let grid = new Grid()
    for (let agent of this.agents) {
      if(this.enableResize) {  agent.resize(); }
      let i = Math.floor(agent.position.x / CELL_SIZE);
      let j = Math.floor(agent.position.y / CELL_SIZE);
      let others = this.grid.neighbours(i, j)
      
      if(enable_slimeagents && hotspots && this.enableSeparation){
        // let hotspots = hotspot_grid.neighbours(i, j);

        let slime_force = agent.avoid(hotspots)
        agent.applyForce(slime_force, 1);

        let emitter_force = agent.avoid(emitters);
        agent.applyForce(emitter_force, 0.5);
      }
      
      if(this.enableSeparation) {
        let separation = agent.separation(others);
        agent.applyForce(separation, 2);
      }

      agent.update();

      if(agent.active) { count++; }
      if(agent.outside) { this.remove_agent(agent) } else {
        grid.add(agent);
      }
    }
    this.grid = grid;
    if(count === 0) { this.active = false; }
  }

  remove_agent(agent){
    if(agent.obstacle){
      if(debug) { console.log("removing obstacle", agent.obstacle); }
      obstacles.splice(obstacles.indexOf(agent.obstacle), 1);
    }
    this.agents.splice(this.agents.indexOf(agent), 1);
  }

  deposit(){
    if(this.childoptions.enable_obstacles){ return }

    for(let agent of this.agents){
      agent.deposit();
    }
  }

  create_agent(branch, position, idx) {
    let childProps = this.getChildAgentProperties(branch.parent);
          
    let childAgent = new Agent(
      position,
      branch.angle,
      childProps.theta,
      childProps.radius,
      childProps.n, 
      this,
      branch.parent.depth + 1,
      childProps.options,
    );
    
    childAgent.direction = branch.angle;
    this.agents.push(childAgent);
    branch.parent.children.push(childAgent);
    this.branches.splice(idx, 1);
    let childbranches = childAgent.spawn();
    this.branches.push(...childbranches);
  }

  create_group(branch, position, idx) {
    //TODO
  }

  draw() {
    push();

    if(this.show_branches){
      for (let branch of this.branches) {
        let start = branch.parent.position;
        let end = branch.getEndPoint();
        this.draw_branch(start, end);
      }

      for (let agent of this.agents) {
        for (let child of agent.children) {
          this.draw_branch(agent.position, child.position, agent.depth % 2);
        }
      }
    }

    if(this.show_agents){
      for (let agent of this.agents) {
        agent.draw();
      }
    }
    pop();
  }

  draw_branch(start, end){
    push()
      stroke(palette.colours[this.fillColorIndex]);
      noFill();

      if (this.lineStyle === "curved") {
        this.draw_curved_branch(start, end);
      } else {
        line(start.x, start.y, end.x, end.y);
      }

    pop();
  }

  draw_curved_branch(start, end){
    let top = p5.Vector.lerp(start, end, 0.33);
    let bot = p5.Vector.lerp(start, end, 0.66);

    let offset = p5.Vector.sub(end, start).mult(0.45);
    
    offset.rotate(HALF_PI);
    top.add(offset);
    bot.sub(offset);

    bezier(start.x, start.y, top.x, top.y, bot.x, bot.y, end.x, end.y);
  }

  

  canPlaceAgent(position, parent) {
    if(!this.checkBounds(position)) { return false; }
    if(this.agents.length > 200) { return false; }

    if(!this.enableSeparation){
    let dist = p5.Vector.dist(this.position, position);
    if (dist < this.minDistance || dist > this.maxDistance) {
      if(debug) console.log("Too close to center or too far")
      return false;
    }

    
      for (let agent of this.agents) {
        let dist = p5.Vector.dist(position, agent.position);
        if (dist < this.minAgentDistance || dist < agent.radius * 1.25) {
          if(debug) console.log("Too close to another agent")
          return false;
        }
      }
    }

    for (let otherGroup of groups) {
      if (otherGroup === this) continue;
      let matched_colour = false;
      
      for(let colour_index of this.colourGroup){
        if(otherGroup.fillColorIndex === colour_index){
          matched_colour = true;
          break;
        }
      }

      if(matched_colour || this.separate){

        for (let other of otherGroup.agents) {
          let dist = p5.Vector.dist(position, other.position);
          if (dist < this.minAgentDistance) {
            return false;
          }
        }
      }
    }

  
    return true;
  }

  checkBounds(position) {
    if (
      position.x < this.bounds.x ||
      position.x > this.bounds.x + this.bounds.w ||
      position.y < this.bounds.y ||
      position.y > this.bounds.y + this.bounds.h
    ) {
      return false;
    }
    return true;
  }

  // move this to branch?
  branchIntersects(newConn, end) {
    let start = newConn.parent.position;

    for (let other of this.branches) {
      if (other === newConn) {continue;}
      let other_start = other.parent.position;
      let other_end = other.getEndPoint();

      if (linesIntersect(start, end, other_start, other_end)) {
        return true;
      }

      for(let agent of this.agents){
        if(agent === newConn.parent) {continue;}
        if(agent.children.length > 0) {
          let agent_end = agent.position;
          for(let child of agent.children){
            let agent_start = child.position;
            if (linesIntersect(start, end, agent_start, agent_end)) {
              return true;
            }
          }
        }

        if(this.branchIntersectsAgent(newConn, agent)){
          return true;
        }
      }
    }

    if(this.separate){
      for (let otherGroup of groups) {
        if (otherGroup === this) {continue;}

        for (let other of otherGroup.agents) {
          for (let child of other.children) {
            let other_start = other.position;
            let other_end = child.position;
            if (linesIntersect(start, end, other_start, other_end)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  branchIntersectsAgent(branch, agent) {
    let start = branch.parent.position;
    let end = branch.getEndPoint();
    let center = agent.position;
    let r = agent.radius;
  
    let d = p5.Vector.sub(end, start);
    let f = p5.Vector.sub(start, center);
  
    let a = d.dot(d);
    let b = 2 * f.dot(d);
    let c = f.dot(f) - r * r;
  
    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return false;
    }
  
    discriminant = sqrt(discriminant);
    let t1 = (-b - discriminant) / (2 * a);
    let t2 = (-b + discriminant) / (2 * a);
  
    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
      return true;
    }
    return false;
  }

  getChildAgentProperties(parent) {
    return { theta: this.childTheta, radius: this.childRadius, n: this.childN, options: this.childoptions };
  }

  export(){
    if(this.agents.length === 0) { return; } 
    let root = this.agents[0];
    let data = {
      lineStyle: this.lineStyle,
      minDistance: this.minDistance,
      maxDistance: this.maxDistance,
      minAgentDistance: this.minAgentDistance,
      childN: this.childN,
      childTheta: this.childTheta,
      childRadius: this.childRadius,
      rootN: root.n,
      rootRadius: root.radius,
      rootTheta: root.theta,
      
    }

    console.log(data)
  }
}



function draw_groups(colour_index, update = true) {
  push();
  for (let group of groups) {
    if (group.strokeColorIndex != colour_index) { continue; }
    
    if(update) { 
      if(debug) { console.log("updating group", group.strokeColorIndex);   }
      group.update(); 
    }
    group.deposit();
    group.draw();
  }
  pop();
}

function remove_intersecting_agents(){
  for(let group of groups){
    for(let other of groups){
      for(let agent of group.agents){
        for(let other_agent of other.agents){
          if(agent === other_agent) { continue; }
          let dist = p5.Vector.dist(agent.position, other_agent.position);
          if(dist < (agent.radius + other_agent.radius + 0.1)){
            group.remove_agent(agent);
            break;
          }
        }
      }
    }
  }
}

function delete_empty_groups() {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].branches.length === 0 && groups[i].agents.length < 6) {
      groups.splice(i, 1);
    }
  }
} 
