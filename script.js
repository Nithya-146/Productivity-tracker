/***********************
  GLOBAL STATE
************************/
let water = 0;

let habits = {
  wake: false,
  screen: false,
  college: false,
  tech: false,
  communication: false,
  reading: false,
  hindi: false,
  learn: false
};

/***********************
  UTIL: GET TODAY DATE
************************/
function showCurrentDate() {
  const today = new Date();
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  document.getElementById("currentDate").innerText =
    "📅 " + today.toLocaleDateString("en-IN", options);
}

function getToday() {
  return new Date().toDateString();
}

/***********************
  LOAD DATA ON START
************************/
window.onload = function () {
    showCurrentDate();
  const saved = JSON.parse(localStorage.getItem("trackerData"));
  const today = getToday();
  analyzeProgress();
  drawCharts();



  if (!saved) {
    localStorage.setItem("lastDate", today);
    return;
  }

  const lastDate = localStorage.getItem("lastDate");

  // 🔁 NEW DAY → RESET DAILY DATA
  if (lastDate !== today) {
    saveHistory(saved.lastProductivity || 0);
    resetDailyData();
    localStorage.setItem("lastDate", today);
    saveData();
    return;
  }

  // SAME DAY → LOAD DATA
  water = saved.water || 0;
  document.getElementById("water").innerText = water;
  document.getElementById("waterNote").value = saved.waterNote || "";

  habits = saved.habits || habits;

  for (let key in habits) {
    const checkbox = document.querySelector(
      `input[onchange="toggleHabit('${key}')"]`
    );
    if (checkbox) checkbox.checked = habits[key];

    const note = document.getElementById(key + "Note");
    if (note && saved.notes && saved.notes[key]) {
      note.value = saved.notes[key];
    }
  }

  document.getElementById("weeklyList").innerHTML =
    saved.weeklyTasks || "";
  document.getElementById("monthlyList").innerHTML =
    saved.monthlyTasks || "";

  calculateProductivity();
};

/***********************
  RESET DAILY DATA
************************/
function resetDailyData() {
  water = 0;
  document.getElementById("water").innerText = 0;
  document.getElementById("waterNote").value = "";

  for (let key in habits) {
    habits[key] = false;

    const checkbox = document.querySelector(
      `input[onchange="toggleHabit('${key}')"]`
    );
    if (checkbox) checkbox.checked = false;

    const note = document.getElementById(key + "Note");
    if (note) note.value = "";
  }

  calculateProductivity();
}

/***********************
  SAVE HISTORY
************************/
function saveHistory(percent) {
  let history = JSON.parse(localStorage.getItem("dailyHistory")) || [];
  history.push({
    date: getToday(),
    productivity: percent
  });
  localStorage.setItem("dailyHistory", JSON.stringify(history));
}

/***********************
  SAVE DATA
************************/
function saveData() {
  const notes = {
    wake: document.getElementById("wakeNote").value,
    screen: document.getElementById("screenNote").value,
    college: document.getElementById("collegeNote").value,
    tech: document.getElementById("techNote").value,
    communication: document.getElementById("communicationNote").value,
    reading: document.getElementById("readingNote").value,
    hindi: document.getElementById("hindiNote").value,
    learn: document.getElementById("learnNote").value
  };

  const data = {
    water,
    habits,
    notes,
    waterNote: document.getElementById("waterNote").value,
    weeklyTasks: document.getElementById("weeklyList").innerHTML,
    monthlyTasks: document.getElementById("monthlyList").innerHTML,
    lastProductivity: calculateProductivity(false)
  };

  localStorage.setItem("trackerData", JSON.stringify(data));
}

/***********************
  WATER (4 LITERS)
************************/
function changeWater(value) {
  water += value;
  if (water < 0) water = 0;
  if (water > 4) water = 4;

  document.getElementById("water").innerText = water;
  calculateProductivity();
  saveData();
}

/***********************
  HABITS
************************/
function toggleHabit(habit) {
  habits[habit] = !habits[habit];
  calculateProductivity();
  saveData();
}

/***********************
  DAILY PRODUCTIVITY
************************/
function calculateProductivity(updateUI = true) {
  let completed = 0;
  const total = 9;

  if (water >= 4) completed++;

  for (let key in habits) {
    if (habits[key]) completed++;
  }

  const percent = Math.round((completed / total) * 100);

  if (updateUI) {
    document.getElementById("dailyProgress").value = percent;
    document.getElementById("dailyText").innerText =
      percent + "% Productive";
    document.getElementById("habitPercent").innerText =
      "Habit Completion: " + percent + "%";

    let message = "";
    if (percent === 100) message = "🌟 Perfect day!";
    else if (percent >= 75) message = "🔥 Very productive!";
    else if (percent >= 50) message = "🙂 Good effort!";
    else message = "💪 New day, new chance!";

    document.getElementById("dailyMessage").innerText = message;
  }

  return percent;
}

/***********************
  WEEKLY / MONTHLY TASKS
************************/
function addTask(type) {
  const input = document.getElementById(type + "Input");
  const list = document.getElementById(type + "List");

  if (input.value.trim() === "") return;

  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${input.value}</strong>
    <button onclick="completeTask(this)">✔ Complete</button>
    <textarea placeholder="Reason if not completed"></textarea>
  `;

  list.appendChild(li);
  input.value = "";
  saveData();
}

function completeTask(btn) {
  const task = btn.parentElement;
  task.style.textDecoration = "line-through";

  const note = task.querySelector("textarea");
  if (note) note.style.display = "none";

  saveData();
}
/***********************
  WEEKLY & MONTHLY ANALYSIS
************************/
function analyzeProgress() {
  const history = JSON.parse(localStorage.getItem("dailyHistory")) || [];
  if (history.length === 0) {
    document.getElementById("weeklyResult").innerText = "No data yet.";
    document.getElementById("monthlyResult").innerText = "No data yet.";
    return;
  }

  const now = new Date();
  let weekData = [];
  let monthData = [];

  history.forEach(entry => {
    const entryDate = new Date(entry.date);
    const diffDays = (now - entryDate) / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) weekData.push(entry.productivity);
    if (diffDays <= 30) monthData.push(entry.productivity);
  });

  // Weekly
  if (weekData.length > 0) {
    const avgWeek = Math.round(
      weekData.reduce((a, b) => a + b, 0) / weekData.length
    );
    document.getElementById("weeklyResult").innerText =
      `Average: ${avgWeek}% | Days tracked: ${weekData.length}`;
  } else {
    document.getElementById("weeklyResult").innerText = "No weekly data.";
  }

  // Monthly
  if (monthData.length > 0) {
    const avgMonth = Math.round(
      monthData.reduce((a, b) => a + b, 0) / monthData.length
    );

    let msg = "";
    if (avgMonth >= 80) msg = "🔥 Excellent consistency!";
    else if (avgMonth >= 60) msg = "👍 Good progress, keep improving.";
    else msg = "💪 Focus more next month.";

    document.getElementById("monthlyResult").innerText =
      `Average: ${avgMonth}% | ${msg}`;
  } else {
    document.getElementById("monthlyResult").innerText = "No monthly data.";
  }
}
/***********************
  CHARTS
************************/
let weeklyChart, monthlyChart;

function drawCharts() {
  const history = JSON.parse(localStorage.getItem("dailyHistory")) || [];
  if (history.length === 0) return;

  const now = new Date();
  let weekLabels = [];
  let weekData = [];
  let monthLabels = [];
  let monthData = [];

  history.forEach(entry => {
    const d = new Date(entry.date);
    const diff = (now - d) / (1000 * 60 * 60 * 24);

    if (diff <= 7) {
      weekLabels.push(d.toLocaleDateString("en-IN", { weekday: "short" }));
      weekData.push(entry.productivity);
    }

    if (diff <= 30) {
      monthLabels.push(d.getDate());
      monthData.push(entry.productivity);
    }
  });

  // Destroy old charts (important)
  if (weeklyChart) weeklyChart.destroy();
  if (monthlyChart) monthlyChart.destroy();

  // Weekly Bar Chart
  weeklyChart = new Chart(
    document.getElementById("weeklyChart"),
    {
      type: "bar",
      data: {
        labels: weekLabels,
        datasets: [{
          label: "Productivity %",
          data: weekData,
          backgroundColor: "rgba(54, 162, 235, 0.6)"
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    }
  );

  // Monthly Line Chart
  monthlyChart = new Chart(
    document.getElementById("monthlyChart"),
    {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: [{
          label: "Productivity %",
          data: monthData,
          borderColor: "rgba(255, 99, 132, 1)",
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    }
  );
}

