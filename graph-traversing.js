const graphGridElement = document.getElementById('graphGrid');
const restartBtn = document.getElementById('restartBtn');
const wallsModeBtn = document.getElementById('wallsModeBtn');
const wallsRemoveBtn = document.getElementById('wallsRemoveBtn');
const bfsBtn = document.getElementById('bfsBtn');
const twoWayBfsBtn = document.getElementById('twoWayBfsBtn');
const dfsBtn = document.getElementById('dfsBtn');

const gridX = 30;
const gridY = 20;
const gridArray = [];

// Create grid element with rows and cols
for (let i = 0; i < gridY; i++) {
  gridArray[i] = [];

  const gridRow = document.createElement('div');
  gridRow.className = 'grid-row';

  for (let j = 0; j < gridX; j++) {
    // traversable cell = 1; untraversable cell (wall) = 2
    gridArray[i][j] = 1;

    const gridCell = document.createElement('div');
    gridCell.className = 'grid-cell';

    gridRow.appendChild(gridCell);
  }

  graphGridElement.append(gridRow);
}

// Create the map for every grid cell's neighbours
const gridRelations = new Map();

// Check if the adjacent cell exists and if it isn't a wall (2)
const getCellRelations = (i, j) => ({
  hasLeft: gridArray[i][j - 1] && gridArray[i][j - 1] !== 2,
  hasTop: gridArray[i - 1] && gridArray[i - 1][j] && gridArray[i - 1][j] !== 2,
  hasRight: gridArray[i][j + 1] && gridArray[i][j + 1] !== 2,
  hasBottom:
    gridArray[i + 1] && gridArray[i + 1][j] && gridArray[i + 1][j] !== 2
});

// Helper function to join indices for a cell unique-string name
const indexSeparator = ',';
const cellName = (i, j) => [i, j].join(indexSeparator);

const shuffleArray = (array) => {
  for (let i = 0; i < array.length; i++) {
    const newRandomIndex = Math.floor(Math.random() * array.length);

    const temp = array[i];
    array[i] = array[newRandomIndex];
    array[newRandomIndex] = temp;
  }
};

// Get and store the neighbours of every individual grid cell
const getGridRelations = (shuffleDirections = false) => {
  for (let i = 0; i < gridY; i++) {
    for (let j = 0; j < gridX; j++) {
      const gridCellNeighbours = [];
      const cellRelations = getCellRelations(i, j);

      if (cellRelations.hasLeft) gridCellNeighbours.push([i, j - 1]);
      if (cellRelations.hasTop) gridCellNeighbours.push([i - 1, j]);
      if (cellRelations.hasRight) gridCellNeighbours.push([i, j + 1]);
      if (cellRelations.hasBottom) gridCellNeighbours.push([i + 1, j]);

      if (shuffleDirections) shuffleArray(gridCellNeighbours);

      gridRelations.set(cellName(i, j), gridCellNeighbours);
    }
  }
};

// Animate cell that was visited
const animateCell = (i, j) => {
  const selectedCell = graphGridElement.childNodes[i].childNodes[j];
  // selectedCell.classList.remove('active');
  // void selectedCell.offsetWidth;
  selectedCell.classList.add('active');
};

const animatePath = (i, j) => {
  const selectedCell = graphGridElement.childNodes[i].childNodes[j];
  selectedCell.classList.remove('active');
  selectedCell.classList.add('path');
};

const animateEnds = (i, j) => {
  const selectedCell = graphGridElement.childNodes[i].childNodes[j];
  selectedCell.classList.remove('target');
  // To retrigger the animation
  void selectedCell.offsetWidth;
  selectedCell.classList.add('target');
};

// Disable the animated cell
const disableCell = (i, j, clearWall = false) => {
  const selectedCell = graphGridElement.childNodes[i].childNodes[j];
  selectedCell.classList.remove('active');
  selectedCell.classList.remove('target');
  selectedCell.classList.remove('path');
  if (clearWall) selectedCell.classList.remove('wall');
};

// Animate the cell and all its adjacent neighbours
const animateCellWithNeighbours = (i, j) => {
  animateCell(i, j);

  const cellNeighbours = gridRelations.get(cellName(i, j));
  for (const cellNeighbour of cellNeighbours) animateCell(...cellNeighbour);
};

// Disable the cell and all its neighbours
const gridCellDisableWithNeighbours = (i, j) => {
  disableCell(i, j);

  const cellNeighbours = gridRelations.get(cellName(i, j));
  for (const cellNeighbour of cellNeighbours) disableCell(...cellNeighbour);
};

// The start and end points to perform the path search on
const searchPoints = {
  startCell: null,
  endCell: null
};

let isRunning = false;

// Disable all the cells and clear the search points
let animationTimers = [];
restartBtn.addEventListener('click', (event) => {
  for (const animationTimer of animationTimers) {
    clearTimeout(animationTimer);
  }

  animationTimers = [];
  pathAnimations = [];
  pathAnimationsStart = [];
  pathAnimationsDestination = [];

  isRunning = false;
  searchPoints.startCell = null;
  searchPoints.endCell = null;
  graphGridElement.dataset.isClear = true;

  bfsBtn.classList.remove('active');
  twoWayBfsBtn.classList.remove('active');
  dfsBtn.classList.remove('active');

  for (let i = 0; i < gridY; i++) {
    for (let j = 0; j < gridX; j++) {
      disableCell(i, j);
    }
  }
});

// Toggle walls editor mode
let wallsMode = false;
wallsModeBtn.addEventListener('click', (event) => {
  if (isRunning) return;

  wallsMode = !wallsMode;
  graphGridElement.dataset.wallsMode = wallsMode;
  wallsModeBtn.classList.toggle('active');
});

// Remove walls and clear the whole grid, reset everything if the animation is not running
wallsRemoveBtn.addEventListener('click', () => {
  if (isRunning) return;

  animationTimers = [];
  pathAnimations = [];
  pathAnimationsStart = [];
  pathAnimationsDestination = [];

  searchPoints.startCell = null;
  searchPoints.endCell = null;
  graphGridElement.dataset.isClear = true;

  bfsBtn.classList.remove('active');
  twoWayBfsBtn.classList.remove('active');
  dfsBtn.classList.remove('active');

  for (let i = 0; i < gridY; i++) {
    for (let j = 0; j < gridX; j++) {
      gridArray[i][j] = 1;
      disableCell(i, j, true);
    }
  }
});

// Convert simple cell to wall block both in the UI and the grid matrix
const convertToWall = (i, j) => {
  const selectedCell = graphGridElement.childNodes[i].childNodes[j];

  gridArray[i][j] = 2;
  selectedCell.classList.add('wall');
};

// Select start and end cells to start the animation automatically (for the moment)
const gridCellSelectPoints = (i, j) => {
  // Don't do anything if cell is a wall or the animation is currently running
  if (gridArray[i][j] === 2 || (searchPoints.startCell && searchPoints.endCell))
    return;

  const selectedCell = graphGridElement.childNodes[i].childNodes[j];
  selectedCell.classList.add('target');

  // Set the start cell position
  if (!searchPoints.startCell) {
    return (searchPoints.startCell = [i, j]);
  }

  // Check for the end cell to differ from the start cell and start the animation
  if (cellName(i, j) !== cellName(...searchPoints.startCell)) {
    searchPoints.endCell = [i, j];
    // animateSearch(searchPoints.startCell, searchPoints.endCell);
  }
};

// Set the click handler for every grid cell
for (let i = 0; i < gridY; i++) {
  for (let j = 0; j < gridX; j++) {
    const gridCell = graphGridElement.childNodes[i].childNodes[j];

    gridCell.addEventListener('mouseenter', (event) => {
      event.preventDefault();
      if (wallsMode && event.buttons === 1) convertToWall(i, j);
    });

    gridCell.addEventListener('click', (event) => {
      event.preventDefault();
      if (!wallsMode) gridCellSelectPoints(i, j);
      else convertToWall(i, j);
    });
  }
}

const constructPath = (startCell, destinationCell, connectedCells) => {
  const constructedPath = [];
  let currentCell = destinationCell;
  console.log(
    `From ${cellName(...startCell)} to ${cellName(...destinationCell)}`
  );

  while (cellName(...currentCell) !== cellName(...startCell)) {
    constructedPath.unshift(currentCell);

    const linkedCell = connectedCells.get(cellName(...currentCell));
    currentCell = linkedCell;
  }

  // Prevent the destination cell from being animated
  constructedPath.pop();

  return constructedPath;
};

const createShortestPathAnimation = (
  pathArray,
  startCell,
  destinationCell,
  animations
) => {
  animations.push({ type: 'highlightEnds', cellVisited: startCell });

  for (const pathCell of pathArray) {
    animations.push({ type: 'highlightPath', cellVisited: pathCell });
  }

  animations.push({ type: 'highlightEnds', cellVisited: destinationCell });
};

let pathAnimations = [];

const breadthFirstSearch = (startCell, destinationCell) => {
  const visited = new Set();
  const queue = [startCell];
  const animations = [];
  const connectedCells = new Map();

  visited.add(cellName(...startCell));

  while (queue.length > 0) {
    const cellToVisit = queue.shift();

    if (cellName(...cellToVisit) === cellName(...destinationCell)) {
      console.log('found it with bfs!');
      const constructedPath = constructPath(
        startCell,
        destinationCell,
        connectedCells
      );
      createShortestPathAnimation(
        constructedPath,
        startCell,
        destinationCell,
        pathAnimations
      );

      return animations;
    }

    if (cellName(...cellToVisit) !== cellName(...startCell))
      animations.push({ type: 'highlightVisited', cellVisited: cellToVisit });

    const cellNeighbours = gridRelations.get(cellName(...cellToVisit));

    for (const cellNeighbour of cellNeighbours) {
      if (!visited.has(cellName(...cellNeighbour))) {
        connectedCells.set(cellName(...cellNeighbour), cellToVisit);
        visited.add(cellName(...cellNeighbour));
        queue.push(cellNeighbour);
      }
    }
  }

  return animations;
};

let pathAnimationsStart = [];
let pathAnimationsDestination = [];

const twoWayBreadthFirstSearch = (startCell, destinationCell) => {
  const visitedStart = new Set();
  const visitedDestination = new Set();

  const queueStart = [startCell];
  const queueDestination = [destinationCell];

  const animations = [];

  const connectedCellsStart = new Map();
  const connectedCellsDestination = new Map();

  visitedStart.add(cellName(...startCell));
  visitedDestination.add(cellName(...destinationCell));

  while (queueStart.length > 0 && queueDestination.length > 0) {
    const cellStartToVisit = queueStart.shift();
    const cellDestinationToVisit = queueDestination.shift();

    // Animate the cells that have both been visited
    if (cellName(...cellStartToVisit) !== cellName(...startCell))
      animations.push({
        type: 'highlightVisited',
        cellVisited: cellStartToVisit
      });
    if (cellName(...cellDestinationToVisit) !== cellName(...destinationCell))
      animations.push({
        type: 'highlightVisited',
        cellVisited: cellDestinationToVisit
      });

    // Check if the visited from start cell already includes the cell that has to be visited from the destination cell
    if (visitedStart.has(cellName(...cellDestinationToVisit))) {
      console.log('found it with two way bfs!');

      const constructedPathStart = constructPath(
        startCell,
        cellDestinationToVisit,
        connectedCellsStart
      );

      const constructedPathDestination = constructPath(
        destinationCell,
        connectedCellsDestination.get(cellName(...cellDestinationToVisit)),
        connectedCellsDestination
      );

      createShortestPathAnimation(
        constructedPathStart,
        startCell,
        cellDestinationToVisit,
        pathAnimationsStart
      );

      createShortestPathAnimation(
        constructedPathDestination,
        destinationCell,
        connectedCellsDestination.get(cellName(...cellDestinationToVisit)),
        pathAnimationsDestination
      );

      return animations;
    }

    // Check if the visited from destination cell already includes the cell that has to be visited from the start cell
    if (visitedDestination.has(cellName(...cellStartToVisit))) {
      console.log('found it with two way bfs!');

      const constructedPathStart = constructPath(
        startCell,
        connectedCellsStart.get(cellName(...cellStartToVisit)),
        connectedCellsStart
      );

      const constructedPathDestination = constructPath(
        destinationCell,
        cellStartToVisit,
        connectedCellsDestination
      );

      createShortestPathAnimation(
        constructedPathStart,
        startCell,
        connectedCellsStart.get(cellName(...cellStartToVisit)),
        pathAnimationsStart
      );

      createShortestPathAnimation(
        constructedPathDestination,
        destinationCell,
        cellStartToVisit,
        pathAnimationsDestination
      );

      return animations;
    }

    let cellStartNeighbours = [];
    let cellDestinationNeighbours = [];

    if (cellStartToVisit)
      cellStartNeighbours = gridRelations.get(cellName(...cellStartToVisit));
    if (cellDestinationToVisit)
      cellDestinationNeighbours = gridRelations.get(
        cellName(...cellDestinationToVisit)
      );

    const cellWithMoreNeighbours =
      cellStartNeighbours.length > cellDestinationNeighbours.length
        ? cellStartNeighbours
        : cellDestinationNeighbours;

    const checkIfVisited = (
      cellToCheck,
      visitedSet,
      queueArray,
      cellToVisit,
      connectedCellsMap
    ) => {
      if (!visitedSet.has(cellName(...cellToCheck))) {
        connectedCellsMap.set(cellName(...cellToCheck), cellToVisit);
        visitedSet.add(cellName(...cellToCheck));
        queueArray.push(cellToCheck);
      }
    };

    // Check the neighbours from both ways in a mixed manner
    for (let i = 0; i < cellWithMoreNeighbours.length; i++) {
      if (cellStartNeighbours[i]) {
        checkIfVisited(
          cellStartNeighbours[i],
          visitedStart,
          queueStart,
          cellStartToVisit,
          connectedCellsStart
        );
      }
      if (cellDestinationNeighbours[i]) {
        checkIfVisited(
          cellDestinationNeighbours[i],
          visitedDestination,
          queueDestination,
          cellDestinationToVisit,
          connectedCellsDestination
        );
      }
    }
  }

  return animations;
};

const depthFirstSearchRecursive = (
  startCell,
  destinationCell,
  visited = new Set(),
  animations
) => {
  if (visited.has(cellName(...startCell))) return;
  visited.add(cellName(...startCell));
  animations.push({ type: 'highlightVisited', cellVisited: startCell });

  if (cellName(...startCell) === cellName(...destinationCell)) {
    console.log('found it with dfs!');
    return true;
  }

  const cellNeighbours = gridRelations.get(cellName(...startCell));

  for (const cellNeighbour of cellNeighbours) {
    const foundIt = depthFirstSearchRecursive(
      cellNeighbour,
      destinationCell,
      visited,
      animations
    );
    // break out of the recursive calls
    if (foundIt) return true;
  }

  return false;
};

const depthFirstSearchStack = (startCell, destinationCell) => {
  const visited = new Set();
  const stack = [startCell];
  const animations = [];

  while (stack.length > 0) {
    const cellToVisit = stack.pop();
    if (cellName(...cellToVisit) !== cellName(...startCell))
      animations.push({ type: 'highlightVisited', cellVisited: cellToVisit });

    const cellNeighbours = gridRelations.get(cellName(...cellToVisit));

    for (const cellNeighbour of cellNeighbours) {
      if (cellName(...cellNeighbour) === cellName(...destinationCell)) {
        console.log('found it with dfs!');
        return animations;
      }

      if (!visited.has(cellName(...cellNeighbour))) {
        visited.add(cellName(...cellNeighbour));
        stack.push(cellNeighbour);
      }
    }
  }

  return animations;
};

bfsBtn.addEventListener('click', () => {
  if (
    searchPoints.startCell &&
    searchPoints.endCell &&
    !isRunning &&
    graphGridElement.dataset.isClear === 'true'
  )
    animateSearch(searchPoints.startCell, searchPoints.endCell, 'bfs');
});

twoWayBfsBtn.addEventListener('click', () => {
  if (
    searchPoints.startCell &&
    searchPoints.endCell &&
    !isRunning &&
    graphGridElement.dataset.isClear === 'true'
  )
    animateSearch(searchPoints.startCell, searchPoints.endCell, 'two-way-bfs');
});

dfsBtn.addEventListener('click', () => {
  if (
    searchPoints.startCell &&
    searchPoints.endCell &&
    !isRunning &&
    graphGridElement.dataset.isClear === 'true'
  )
    animateSearch(searchPoints.startCell, searchPoints.endCell, 'dfs');
});

const animateSearch = (start, end, algorithm) => {
  getGridRelations();

  let animations = [];

  if (algorithm === 'bfs') {
    animations = breadthFirstSearch(start, end);
    bfsBtn.classList.add('active');
  }
  if (algorithm === 'dfs') {
    depthFirstSearchRecursive(start, end, new Set(), animations);
    dfsBtn.classList.add('active');
  }
  if (algorithm === 'two-way-bfs') {
    animations = twoWayBreadthFirstSearch(start, end);
    twoWayBfsBtn.classList.add('active');

    const longerPathAnimations =
      pathAnimationsStart.length > pathAnimationsDestination.length
        ? pathAnimationsStart
        : pathAnimationsDestination;

    for (let i = 0; i < longerPathAnimations.length; i++) {
      if (pathAnimationsStart[i]) pathAnimations.push(pathAnimationsStart[i]);
      if (pathAnimationsDestination[i])
        pathAnimations.push(pathAnimationsDestination[i]);
    }
  }

  const animationDelay = 30; // ms
  isRunning = true;
  graphGridElement.dataset.isClear = false;

  for (let i = 0; i < animations.length; i++) {
    const animationTimer = setTimeout(() => {
      const { type, cellVisited } = animations[i];

      if (type === 'highlightVisited') animateCell(...cellVisited);

      // Animation of the visited cells is over
      if (i === animations.length - 1) {
        // Animate the shortest path after 500ms
        setTimeout(() => {
          for (let j = 0; j < pathAnimations.length; j++) {
            const pathAnimationTimer = setTimeout(() => {
              const { type, cellVisited } = pathAnimations[j];

              if (type === 'highlightPath') animatePath(...cellVisited);
              if (type === 'highlightEnds') animateEnds(...cellVisited);

              if (j === pathAnimations.length - 1) {
                isRunning = false;
              }
            }, j * animationDelay * 1.5);
            animationTimers.push(pathAnimationTimer);
          }
        }, 100);
      }
    }, i * animationDelay);
    animationTimers.push(animationTimer);
  }
};
