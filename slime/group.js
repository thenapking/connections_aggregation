class SlimeGroup {
  constructor(id, stepSize, sensorAngle, sensorDistance, turnAngle, 
    colour, 
    hotspot_proximity = 40, agents_per_emitter = 100,
    min_journeys = MIN_JOURNEYS_TO_DRAW
    ) {
    this.id = id;
    this.stepSize = stepSize;
    this.sensorAngle = sensorAngle;
    this.sensorDistance = sensorDistance;
    this.turnAngle = turnAngle;
    this.attraction = [];
    this.agents = [];
    this.colour = colour;
    this.hotspot_proximity = hotspot_proximity; 
    this.agents_per_emitter = agents_per_emitter;
    this.min_journeys = min_journeys;
  }

  setAttraction(other_id, value) {
    this.attraction[other_id] = value;
  }

  getAttraction(other_id) {
    return this.attraction[other_id] || 0;
  }
}

function find_group(id){
  for (let group of slimegroups) {
    if (group.id === id) {
      return group;
    }
  }
  return null;
}
