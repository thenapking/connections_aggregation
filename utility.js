let gui;

const groupSettings = {
  fillColorIndex: 4,    // Dropdown: key from palette.colours
  strokeColorIndex: 4,  // Dropdown: key from palette.colours
  lineStyle: "straight",

  showAgents: true,
  showBranches: true,
  terminateBranchesEarly: false,

  separate: true,
  direction: 3.141,
  eccentricity: 0.5,

  minDistance: 30,
  maxDistance: 150,
  minAgentDistance: 20,
  minAgentSize: 4,
  maxAgentSize: 20,

  noiseScale: 0.01,

  rootN: 48,
  rootRadius: 10,
  rootTheta: 3.141 * 2,
  obstacleSize: 10,

  childN: 1,
  childTheta: Math.PI / 6,
  childRadius: 5,

  enableSeparation: false,
  enableResize: false,
  enableAlignment: false,
  enableObstacles: false

};


const presetSettings = {
  selectedPreset: Object.keys(plants)[0] 
};

function setup_gui(){
  gui = gui = new dat.GUI();

  gui.add(groupSettings, "fillColorIndex", Object.keys(palette.colours)).name("Fill Colour");
  gui.add(groupSettings, "strokeColorIndex", Object.keys(palette.colours)).name("Stroke Colour");
  gui.add(groupSettings, "lineStyle", ["straight", "curved"]).name("Line Style");
  
  gui.add(groupSettings, "showAgents").name("Show Agents");
  gui.add(groupSettings, "showBranches").name("Show Branches");
  gui.add(groupSettings, "terminateBranchesEarly").name("Terminate");

  gui.add(groupSettings, "separate").name("Separate");
  gui.add(groupSettings, "direction", 0, TWO_PI, 0.1).name("Direction");
  gui.add(groupSettings, "eccentricity", 0, 1, 0.01).name("Eccentricity");

  gui.add(groupSettings, "minDistance",  0, 100, 1).name("Connection Min Dist");
  gui.add(groupSettings, "maxDistance", 50, 400, 1).name("Connection Max Dist");
  gui.add(groupSettings, "minAgentDistance", 0, 100, 1).name("Agent Min Dist");
  gui.add(groupSettings, "minAgentSize", 0, 100, 1).name("Agent Min Size");
  gui.add(groupSettings, "maxAgentSize", 0, 100, 1).name("Agent Min Size");

  gui.add(groupSettings, "noiseScale", 0.001, 0.05, 0.001).name("Noise Scale");

  gui.add(groupSettings, "rootN", 1, 100, 1).name("Root Connections");
  gui.add(groupSettings, "rootRadius", 5, 50, 1).name("Root Size");
  gui.add(groupSettings, "rootTheta", 0, TWO_PI, 0.1).name("Root Theta");
  gui.add(groupSettings, "obstacleSize", 5, 400, 1).name("Obstacle Size");

  gui.add(groupSettings, "childN", 0, 20, 1).name("Child Connections");
  gui.add(groupSettings, "childTheta", 0, TWO_PI, 0.1).name("Child Theta");
  gui.add(groupSettings, "childRadius", 2, 20, 1).name("Child Size");

  gui.add(groupSettings, "enableSeparation").name("Enable Separation");
  gui.add(groupSettings, "enableResize").name("Enable Resize");
  gui.add(groupSettings, "enableAlignment").name("Enable Alignment");
  gui.add(groupSettings, "enableObstacles").name("Enable Obstacles");

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
      } 
    },
    showSlime: function() {
      show_slime = !show_slime;
    },
    pauseSlime: function() {
      enable_slimeagents = !enable_slimeagents;
    },
    removeSlime: function() {
      delete_slimeagents();
    },
    addSlime: function() {
      if(slimeagents.length > 0){ return; }
      create_slimeagents();
    },
    pause: function() {
      running = !running;
      if (running) {
        loop();
      }
    },
    debug: function() {
      debug = !debug;
    }
  };

  gui.add(guiControls, "removeLastGroup").name("Remove Last Group");
  gui.add(guiControls, "pauseSlime").name("Pause Slime");
  gui.add(guiControls, "showSlime").name("Show Slime");
  gui.add(guiControls, "removeSlime").name("Remove Slime");
  gui.add(guiControls, "addSlime").name("Add Slime");
  gui.add(guiControls, "pause").name("Pause");
  gui.add(guiControls, "debug").name("Debug");
}

function updateGUIControllers() {
  gui.__controllers.forEach(controller => controller.updateDisplay());
}


