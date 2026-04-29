const state = {
  tunerSolved: false,
  starsSolved: false,
  boardSolved: false,
  starSequence: [],
  path: [],
  glitching: false,
};

const storageKey = "vanguardMirrorProgress";
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const terminalOutput = document.getElementById("terminalOutput");
const terminalForm = document.getElementById("terminalForm");
const terminalInput = document.getElementById("terminalInput");
const stabilityMetric = document.getElementById("stabilityMetric");
const logTemplateNode = document.getElementById("logTemplate");
const logTemplate = logTemplateNode ? logTemplateNode.content.textContent.trim() : "";
const signalClue = document.getElementById("signalClue");
const recoveryArtifact = document.getElementById("recoveryArtifact");

const starData = [
  { name: "VEIL-7", x: 18, y: 30 },
  { name: "NOVA-2", x: 34, y: 58 },
  { name: "KITE-4", x: 52, y: 42 },
  { name: "ORI-SHIFT", x: 68, y: 21 },
  { name: "HOME", x: 46, y: 70 },
  { name: "LATCH-9", x: 81, y: 60 },
];

const fragmentData = {
  tuner: [
    "Fragment 01",
    "Vanguard Laboratory detected the signal before the artifact was ever recovered.",
    "It appeared as a repeating pulse - structured, precise, and unnatural.",
    "The source was located and retrieved.",
  ],
  stars: [
    "Fragment 02",
    "During testing, activation caused brief spatial distortion around the lab.",
    "Star-mapping systems shifted before stabilizing.",
    "Analysis confirmed the device functions as a navigation system.",
    "Hours after activation, multiple unidentified vessels altered course toward Earth.",
  ],
  board: [
    "Fragment 03",
    "Each move generates coordinates and emits a high-energy transmission from its core, designated Z-Core.",
    "The vessels match known patterns of Zorgons, a species that navigates by tracking energy emissions.",
    "To them, signals are beacons.",
  ],
};

const tunerTarget = [0, 1, 9];
const starTarget = ["VEIL-7", "ORI-SHIFT", "HOME"];
const boardOrder = [6, 7, 12, 17, 18, 13, 8];

function allSolved() {
  return state.tunerSolved && state.starsSolved && state.boardSolved;
}

function saveProgress() {
  const snapshot = {
    tunerSolved: state.tunerSolved,
    starsSolved: state.starsSolved,
    boardSolved: state.boardSolved,
    starSequence: state.starSequence,
    path: state.path,
  };
  sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
}

function loadProgress() {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.tunerSolved = Boolean(parsed.tunerSolved);
    state.starsSolved = Boolean(parsed.starsSolved);
    state.boardSolved = Boolean(parsed.boardSolved);
    state.starSequence = Array.isArray(parsed.starSequence) ? parsed.starSequence : [];
    state.path = Array.isArray(parsed.path) ? parsed.path : [];
  } catch {
    sessionStorage.removeItem(storageKey);
  }
}

function enforceRecoveryLock() {
  if (!recoveryArtifact) return;

  if (allSolved()) {
    recoveryArtifact.classList.remove("is-locked");
    recoveryArtifact.removeAttribute("aria-disabled");
    recoveryArtifact.removeAttribute("tabindex");
    return;
  }

  recoveryArtifact.classList.add("is-locked");
  recoveryArtifact.setAttribute("aria-disabled", "true");
  recoveryArtifact.setAttribute("tabindex", "-1");
  recoveryArtifact.addEventListener("click", (event) => {
    event.preventDefault();
  });
}

function writeTerminal(text, type = "") {
  if (!terminalOutput) return;
  const line = document.createElement("div");
  line.className = `terminal__line${type ? ` terminal__line--${type}` : ""}`;
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function seedTerminal() {
  if (!terminalOutput) return;
  [
    "VANGUARD MIRROR CONSOLE",
    "This shell was not included in the public build.",
    "Type help.",
  ].forEach((line, index) => writeTerminal(line, index === 0 ? "system" : ""));
}

function runCommand(raw) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;

  writeTerminal(`> ${raw}`, "prompt");

  if (cmd === "help") {
    [
      "help                show available console verbs",
      "status              print current unlock status",
      "fragments           list recovered log fragments",
      "mirror              explain what this page is pretending to be",
      "beacon              inspect the final implication once all fragments are recovered",
      "clear               clear console output",
    ].forEach((line) => writeTerminal(line, "system"));
    return;
  }

  if (cmd === "status") {
    writeTerminal(`frequency lattice: ${state.tunerSolved ? "aligned" : "drifting"}`, "system");
    writeTerminal(`cartography leak: ${state.starsSolved ? "decoded" : "scrubbed"}`, "system");
    writeTerminal(`artifact interface: ${state.boardSolved ? "stabilized" : "sealed"}`, "system");
    return;
  }

  if (cmd === "fragments") {
    if (!state.tunerSolved && !state.starsSolved && !state.boardSolved) {
      writeTerminal("no fragments recovered", "system");
      return;
    }
    if (state.tunerSolved) fragmentData.tuner.forEach((line) => writeTerminal(line));
    if (state.starsSolved) fragmentData.stars.forEach((line) => writeTerminal(line));
    if (state.boardSolved) fragmentData.board.forEach((line) => writeTerminal(line));
    if (allSolved()) writeTerminal("Final lines remain under quarantine. Try beacon.", "system");
    return;
  }

  if (cmd === "mirror") {
    writeTerminal("Officially: donor-facing outreach portal for navigational research.", "system");
    writeTerminal("Actually: a disguised containment shell built to slow discovery.", "system");
    return;
  }

  if (cmd === "beacon") {
    if (!allSolved()) {
      writeTerminal("Beacon meaning redacted until all puzzle systems are aligned.", "system");
      return;
    }
    writeTerminal("The artifact is broadcasting Earth's location.", "system");
    writeTerminal("Containment has been initiated. Further activation is not recommended.", "system");
    return;
  }

  if (cmd === "clear") {
    terminalOutput.innerHTML = "";
    seedTerminal();
    return;
  }

  writeTerminal("unknown command", "system");
}

function updateRangeLabels() {
  ["A", "B", "C"].forEach((key) => {
    const input = document.getElementById(`freq${key}`);
    const label = document.getElementById(`freq${key}Label`);
    if (input && label) label.textContent = input.value;
  });
}

function setupTuner() {
  const tuneButton = document.getElementById("tuneButton");
  const response = document.getElementById("tuneResponse");
  if (!tuneButton || !response) return;

  ["A", "B", "C"].forEach((key) => {
    const input = document.getElementById(`freq${key}`);
    if (input) input.addEventListener("input", updateRangeLabels);
  });

  tuneButton.addEventListener("click", () => {
    const values = ["A", "B", "C"].map((key) => Number(document.getElementById(`freq${key}`).value));
    if (values.every((value, index) => value === tunerTarget[index])) {
      state.tunerSolved = true;
      response.textContent = fragmentData.tuner.join("\n");
      if (stabilityMetric) stabilityMetric.textContent = "71.3%";
      saveProgress();
      pulseGlitch();
      writeTerminal("frequency lattice aligned", "system");
      return;
    }
    response.textContent = "Calibration rejected.";
  });
}

function setupStars() {
  const starMap = document.getElementById("starmap");
  const selection = document.getElementById("starSelection");
  const response = document.getElementById("starResponse");
  if (!starMap || !selection || !response) return;

  starData.forEach((star) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "star";
    button.dataset.name = star.name;
    button.style.left = `${star.x}%`;
    button.style.top = `${star.y}%`;

    button.addEventListener("click", () => {
      if (!state.tunerSolved) {
        response.textContent = "The map is quiet.";
        return;
      }
      if (state.starSequence.includes(star.name) || state.starsSolved) return;

      state.starSequence.push(star.name);
      button.classList.add("is-selected");
      selection.textContent = `Selected sequence: ${state.starSequence.join(" -> ")}`;

      if (state.starSequence.length === starTarget.length) {
        if (starTarget.every((name, index) => name === state.starSequence[index])) {
          state.starsSolved = true;
          response.textContent = fragmentData.stars.join("\n");
          saveProgress();
          pulseGlitch();
          writeTerminal("cartography leak decoded", "system");
        } else {
          state.starSequence = [];
          saveProgress();
          response.textContent = "Sequence rejected. Chart reset.";
          selection.textContent = "Selected sequence: none";
          starMap.querySelectorAll(".star").forEach((node) => node.classList.remove("is-selected"));
        }
      }
    });

    starMap.appendChild(button);
  });
}

function tileLabel(index) {
  const col = index % 5;
  const row = Math.floor(index / 5) + 1;
  return `${String.fromCharCode(65 + col)}${row}`;
}

function setupBoard() {
  const board = document.getElementById("board");
  const response = document.getElementById("boardResponse");
  const resetBoard = document.getElementById("resetBoard");
  if (!board || !response || !resetBoard) return;

  for (let i = 0; i < 25; i += 1) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.textContent = tileLabel(i);
    tile.dataset.index = String(i);

    tile.addEventListener("click", () => {
      if (!state.starsSolved) {
        response.textContent = "No accepted sequence.";
        return;
      }
      if (state.boardSolved) return;

      const index = Number(tile.dataset.index);
      const expected = boardOrder[state.path.length];
      if (index !== expected) {
        state.path = [];
        board.querySelectorAll(".tile").forEach((node) => node.classList.remove("is-active"));
        saveProgress();
        response.textContent = "Sequence rejected.";
        return;
      }

      state.path.push(index);
      tile.classList.add("is-active");
      saveProgress();
      response.textContent = `Path stability ${Math.round((state.path.length / boardOrder.length) * 100)}%`;

      if (state.path.length === boardOrder.length) {
        state.boardSolved = true;
        response.textContent = fragmentData.board.join("\n");
        if (stabilityMetric) stabilityMetric.textContent = "18.9%";
        saveProgress();
        pulseGlitch();
        writeTerminal("artifact interface stabilized", "system");
      }
    });

    board.appendChild(tile);
  }

  resetBoard.addEventListener("click", () => {
    state.path = [];
    board.querySelectorAll(".tile").forEach((node) => node.classList.remove("is-active"));
    saveProgress();
    response.textContent = "Board path reset.";
  });
}

function pulseGlitch() {
  if (state.glitching) return;
  state.glitching = true;
  document.body.classList.add("glitch");
  setTimeout(() => {
    document.body.classList.remove("glitch");
    state.glitching = false;
  }, 480);
}

function revealLog() {
  const panel = document.getElementById("finalPanel");
  const card = document.getElementById("logCard");
  const locked = document.getElementById("recoveryLocked");
  if (!panel || !card || !logTemplate) return;

  if (locked) locked.hidden = true;
  panel.hidden = false;
  if (card.childElementCount > 0) return;

  logTemplate.split("\n").forEach((line, index) => {
    const div = document.createElement("div");
    div.className = "line";
    div.textContent = line || " ";
    div.style.animationDelay = `${index * 90}ms`;
    card.appendChild(div);
  });
}

function applySolvedState() {
  const tuneResponse = document.getElementById("tuneResponse");
  const starResponse = document.getElementById("starResponse");
  const boardResponse = document.getElementById("boardResponse");
  const starSelection = document.getElementById("starSelection");
  const boardHint = document.getElementById("boardHint");
  const starMap = document.getElementById("starmap");
  const board = document.getElementById("board");

  if (state.tunerSolved && tuneResponse) {
    tuneResponse.textContent = fragmentData.tuner.join("\n");
    ["A", "B", "C"].forEach((key, index) => {
      const input = document.getElementById(`freq${key}`);
      if (input) input.value = String(tunerTarget[index]);
    });
    updateRangeLabels();
  }

  if (starMap && starSelection && state.starSequence.length > 0 && !state.starsSolved) {
    starSelection.textContent = `Selected sequence: ${state.starSequence.join(" -> ")}`;
    starMap.querySelectorAll(".star").forEach((node) => {
      if (state.starSequence.includes(node.dataset.name)) node.classList.add("is-selected");
    });
  }

  if (state.starsSolved) {
    if (starResponse) starResponse.textContent = fragmentData.stars.join("\n");
    if (starSelection) starSelection.textContent = `Selected sequence: ${starTarget.join(" -> ")}`;
    if (boardHint) boardHint.textContent = "The manual is no longer static.";
    if (starMap) {
      starMap.querySelectorAll(".star").forEach((node) => {
        if (starTarget.includes(node.dataset.name)) node.classList.add("is-selected");
      });
    }
  }

  if (board && state.path.length > 0) {
    board.querySelectorAll(".tile").forEach((node) => {
      if (state.path.includes(Number(node.dataset.index))) node.classList.add("is-active");
    });
    if (boardResponse && !state.boardSolved) {
      boardResponse.textContent = `Path stability ${Math.round((state.path.length / boardOrder.length) * 100)}%`;
    }
  }

  if (state.boardSolved) {
    if (boardResponse) boardResponse.textContent = fragmentData.board.join("\n");
    revealLog();
  }
}

function setupTerminal() {
  if (!terminalForm || !terminalInput) return;
  if (!allSolved()) {
    writeTerminal("VANGUARD MIRROR CONSOLE", "system");
    writeTerminal("Console lock engaged. Complete all three live systems to restore access.");
    terminalInput.disabled = true;
    terminalInput.placeholder = "console lock engaged";
    return;
  }

  terminalInput.disabled = false;
  terminalInput.placeholder = "type help";
  terminalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runCommand(terminalInput.value);
    terminalInput.value = "";
  });
  seedTerminal();
}

function setupGlitchButton() {
  const glitchButton = document.getElementById("glitchButton");
  if (!glitchButton) return;
  glitchButton.addEventListener("click", () => {
    pulseGlitch();
    if (signalClue) {
      signalClue.classList.add("is-visible");
      window.clearTimeout(signalClue._hideTimer);
      signalClue._hideTimer = window.setTimeout(() => {
        signalClue.classList.remove("is-visible");
      }, 3200);
    }
    [
      "Mirror echo: one string survived.",
      "Mirror echo: some arrivals are not arrivals.",
      "Mirror echo: routine language hides intent well.",
      "Mirror echo: maintenance paper travels farther than it should.",
    ]
      .sort(() => Math.random() - 0.5)
      .slice(0, 1)
      .forEach((line) => writeTerminal(line, "system"));
  });
}

function setupStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function seed() {
    stars.length = 0;
    const count = Math.min(160, Math.floor((window.innerWidth * window.innerHeight) / 12000));
    for (let i = 0; i < count; i += 1) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.3,
        alpha: Math.random() * 0.7 + 0.1,
        speed: Math.random() * 0.12 + 0.03,
      });
    }
  }

  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((star, index) => {
      context.fillStyle = `rgba(237,247,255,${star.alpha})`;
      context.beginPath();
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = -10;
        star.x = Math.random() * canvas.width;
      }
      if (state.tunerSolved && index % 24 === 0) {
        context.fillStyle = "rgba(124,232,255,0.4)";
        context.beginPath();
        context.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        context.fill();
      }
    });
    requestAnimationFrame(render);
  }

  resize();
  seed();
  render();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });
}

loadProgress();
if (currentPage === "recovery.html" && !allSolved()) {
  window.location.replace("index.html");
}
updateRangeLabels();
setupTerminal();
setupTuner();
setupStars();
setupBoard();
setupGlitchButton();
setupStarfield();
enforceRecoveryLock();
applySolvedState();
