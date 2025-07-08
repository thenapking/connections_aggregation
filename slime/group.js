class SlimeGroup {
  constructor(id, stepSize, sensorAngle, sensorDistance, turnAngle, colour, hotspot_proximity = 40) {
    this.id = id;
    this.stepSize = stepSize;
    this.sensorAngle = sensorAngle;
    this.sensorDistance = sensorDistance;
    this.turnAngle = turnAngle;
    this.attraction = [];
    this.agents = [];
    this.colour = colour;
    this.hotspot_proximity = hotspot_proximity; 
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
