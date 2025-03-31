let plants = {
  basic: {
    "lineStyle": "straight",
    "minDistance": 30,
    "maxDistance": 150,
    "minAgentDistance": 20,
    "rootN": 48,
    "rootRadius": 10,
    "rootTheta": 6.282,
    "childN": 1,
    "childTheta": 0.5235987755982988,
    "childRadius": 5
  },
  big_centre: {
    "lineStyle": "straight",
    "minDistance": 42,
    "maxDistance": 132,
    "minAgentDistance": 14,
    "childN": 1,
    "childTheta": 0.5235987755982988,
    "childRadius": 5,
    "rootN": 48,
    "rootRadius": 20,
    "rootTheta": 6.283185307179586
  },
  spaced_half_moon: {
    "lineStyle": "straight",
    "minDistance": 57,
    "maxDistance": 285,
    "minAgentDistance": 28,
    "childN": 1,
    "childTheta": 0.5235987755982988,
    "childRadius": 5,
    "rootN": 48,
    "rootRadius": 7,
    "rootTheta": 2.869652673046323
  },
  bunch: {
    "lineStyle": "straight",
    "minDistance": 53,
    "maxDistance": 111,
    "minAgentDistance": 13,
    "childN": 1,
    "childTheta": 0.5235987755982988,
    "childRadius": 5,
    "rootN": 48,
    "rootRadius": 7,
    "rootTheta": 1.8526259826149525
  },
  multi_child_bunch: {
    "lineStyle": "straight",
    "minDistance": 30,
    "maxDistance": 150,
    "minAgentDistance": 20,
    "childN": 10,
    "childTheta": 0.5235987755982988,
    "childRadius": 5,
    "rootN": 48,
    "rootRadius": 10,
    "rootTheta": 1.3
  },
  square_plant: {
    "lineStyle": "straight",
    "minDistance": 30,
    "maxDistance": 300,
    "minAgentDistance": 60,
    "childN": 6,
    "childTheta": 4.7,
    "childRadius": 5,
    "rootN": 12,
    "rootRadius": 10,
    "rootTheta": 1
  },
  constellation: {
    "lineStyle": "straight",
    "minDistance": 30,
    "maxDistance": 239,
    "minAgentDistance": 60,
    "childN": 12,
    "childTheta": 3.1,
    "childRadius": 5,
    "rootN": 12,
    "rootRadius": 5,
    "rootTheta": 6.300000000000001
  },
  snowflake: {
    "lineStyle": "straight",
    "minDistance": 46,
    "maxDistance": 144,
    "minAgentDistance": 28,
    "childN": 6,
    "childTheta": 6.300000000000001,
    "childRadius": 5,
    "rootN": 6,
    "rootRadius": 5,
    "rootTheta": 6.300000000000001
  },
  symetrical: {
    "lineStyle": "straight",
    "minDistance": 46,
    "maxDistance": 144,
    "minAgentDistance": 28,
    "childN": 8,
    "childTheta": 6.300000000000001,
    "childRadius": 5,
    "rootN": 12,
    "rootRadius": 5,
    "rootTheta": 6.300000000000001
  },
  wheel: {
    "lineStyle": "straight", // curved also works
    "minDistance": 30, // between 20 and 40
    "maxDistance": 144,
    "minAgentDistance": 10,
    "childN": 8,
    "childTheta": 6.300000000000001,
    "childRadius": 5,
    "rootN": 12, // 12, 16, 24
    "rootRadius": 5,
    "rootTheta": 6.300000000000001
  },
  random_bunches: {
    "lineStyle": "curved",
    "minDistance": 54,
    "maxDistance": 110,
    "minAgentDistance": 10,
    "childN": 8,
    "childTheta": 6.300000000000001,
    "childRadius": 5,
    "rootN": 48,
    "rootRadius": 5,
    "rootTheta": 6.300000000000001
  },
  pompom: {
    "lineStyle": "straight",
    "minDistance": 62,
    "maxDistance": 171,
    "minAgentDistance": 20,
    "childN": 3,
    "childTheta": 0.9,
    "childRadius": 10,
    "rootN": 16,
    "rootRadius": 20,
    "rootTheta": 6.282
}
}

let super_plants = {
  constellation: {
    "lineStyle": "curved",
    "minDistance": 200,
    "maxDistance": 500,
    "minAgentDistance": 200,
    "childN": 12,
    "childTheta": 3.1,
    "childRadius": 10,
    "rootN": 12,
    "rootRadius": 20,
    "rootTheta": 6.300000000000001
  },
  dense_bunch: {
    "lineStyle": "straight",
    "minDistance": 160,
    "maxDistance": 800,
    "minAgentDistance": 80,
    "childN": 10,
    "childTheta": 0.6000000000000001,
    "childRadius": 20,
    "rootN": 48,
    "rootRadius": 40,
    "rootTheta": 1.3
}
}
