function linesIntersect(p1, p2, p3, p4) {
  function ccw(A, B, C) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  }
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}




const groupSettings = {
  fillColorIndex: 4,    // Dropdown: key from palette.colours
  strokeColorIndex: 4,  // Dropdown: key from palette.colours
  lineStyle: "straight",
  separate: true,
  direction: 3.141,
  minDistance: 30,
  maxDistance: 150,
  minAgentDistance: 20,

  noiseThreshold: 1,
  noiseScale: 0.01,

  rootN: 48,
  rootRadius: 10,
  rootTheta: 3.141 * 2,
  childN: 1,
  childTheta: Math.PI / 6,
  childRadius: 5,

};

let gui;

const presetSettings = {
  selectedPreset: Object.keys(plants)[0] 
};

function setup_gui(){
  gui = gui = new dat.GUI();

  gui.add(groupSettings, "fillColorIndex", Object.keys(palette.colours)).name("Fill Colour");
  gui.add(groupSettings, "strokeColorIndex", Object.keys(palette.colours)).name("Stroke Colour");
  gui.add(groupSettings, "lineStyle", ["straight", "curved"]).name("Line Style");

  gui.add(groupSettings, "separate").name("Separate");
  gui.add(groupSettings, "direction", 0, TWO_PI, 0.1).name("Direction");

  gui.add(groupSettings, "minDistance",  0, 100, 1).name("Connection Min Dist");
  gui.add(groupSettings, "maxDistance", 50, 400, 1).name("Connection Max Dist");
  gui.add(groupSettings, "minAgentDistance", 0, 100, 1).name("Agent Min Dist");

  gui.add(groupSettings, "noiseThreshold", 0, 1, 0.01).name("Noise Threshold");
  gui.add(groupSettings, "noiseScale", 0.001, 0.05, 0.001).name("Noise Scale");

  gui.add(groupSettings, "rootN", 1, 100, 1).name("Root Connections");
  gui.add(groupSettings, "rootRadius", 5, 50, 1).name("Root Size");
  gui.add(groupSettings, "rootTheta", 0, TWO_PI, 0.1).name("Root Theta");

  gui.add(groupSettings, "childN", 0, 20, 1).name("Child Connections");
  gui.add(groupSettings, "childTheta", 0, TWO_PI, 0.1).name("Child Theta");
  gui.add(groupSettings, "childRadius", 2, 20, 1).name("Child Size");

  gui.add(presetSettings, "selectedPreset", Object.keys(plants))
   .name("Plant Preset")
   .onChange(function(selected) {
     let preset = plants[selected];
     for (let key in preset) {
       if (groupSettings.hasOwnProperty(key)) {
         groupSettings[key] = preset[key];
       }
     }
     updateGUIControllers();
  });
  

  const guiControls = {
    removeLastGroup: function() {
      if (groups && groups.length > 0) {
        console.log("Removed the last group.", groups[groups.length - 1]);

        groups.splice(groups.length - 1, 1);
      } else {
        console.log("No groups to remove.");
      }
    }
  };

  
  gui.add(guiControls, "removeLastGroup").name("Remove Last Group");
 
  
}

function updateGUIControllers() {
  gui.__controllers.forEach(controller => controller.updateDisplay());
}




