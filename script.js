/************************************************
 * GLOBAL VARIABLES
 ************************************************/
let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let userAnswers = [];
let visitedQuestions = [];
let username = "";

/************************************************
 * LOAD QUESTIONS
 ************************************************/
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    allQuestions = data;
    console.log("Questions loaded:", allQuestions.length);
  })
  .catch(() => {
    alert("Failed to load questions");
  });

/************************************************
 * START QUIZ
 ************************************************/
function startQuiz() {
  const nameInput = document.getElementById("usernameInput");
  username = nameInput.value.trim();

  if (!username) {
    alert("Please enter your name");
    return;
  }

  if (allQuestions.length < 5) {
    alert("Questions not loaded properly. Please refresh.");
    return;
  }

  quizQuestions = [...allQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  currentIndex = 0;
  score = 0;
  userAnswers = [];
  visitedQuestions = [];

  document.getElementById("totalQ").innerText = quizQuestions.length;

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");

  createQuestionNav();
  loadQuestion();
}

/************************************************
 * QUESTION NAV
 ************************************************/
function createQuestionNav() {
  const nav = document.getElementById("questionNav");
  nav.innerHTML = "";

  quizQuestions.forEach((_, i) => {
    const item = document.createElement("div");
    item.className = "q-nav-item";
    item.innerHTML = `<span translate="no">${i + 1}</span>`;
    item.onclick = () => goToQuestion(i);
    nav.appendChild(item);
  });

  updateQuestionNav();
}

function updateQuestionNav() {
  document.querySelectorAll(".q-nav-item").forEach((item, i) => {
    item.classList.remove("current", "answered", "visited");

    if (i === currentIndex) item.classList.add("current");
    else if (userAnswers[i] !== undefined) item.classList.add("answered");
    else if (visitedQuestions[i]) item.classList.add("visited");
  });
}

/************************************************
 * LOAD QUESTION
 ************************************************/
function loadQuestion() {
  const q = quizQuestions[currentIndex];
  visitedQuestions[currentIndex] = true;

  document.getElementById("attempted").innerText = currentIndex + 1;
  document.getElementById("progressBar").style.width =
    ((currentIndex + 1) / quizQuestions.length) * 100 + "%";

  document.getElementById("question").innerText = q.QUESTION;
  document.getElementById("o1").innerText = q.OPTION1;
  document.getElementById("o2").innerText = q.OPTION2;
  document.getElementById("o3").innerText = q.OPTION3;

  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.classList.remove("selected");
    if (userAnswers[currentIndex] === Number(btn.dataset.option)) {
      btn.classList.add("selected");
    }
  });

  updateQuestionNav();
}

/************************************************
 * OPTION SELECT
 ************************************************/
function selectOption(val, btn) {
  userAnswers[currentIndex] = val;

  document.querySelectorAll(".option-btn")
    .forEach(b => b.classList.remove("selected"));

  btn.classList.add("selected");
  updateQuestionNav();
}

/************************************************
 * NEXT / FINISH
 ************************************************/
function nextQuestion() {
  if (userAnswers[currentIndex] === undefined) {
    alert("Please select an option");
    return;
  }

  if (currentIndex < quizQuestions.length - 1) {
    currentIndex++;
    loadQuestion();
  } else {
    finishQuiz();
  }
}

/************************************************
 * FINISH QUIZ
 ************************************************/
function finishQuiz() {
  calculateScore();

  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("resultScreen").classList.remove("hidden");

  buildReview();

  document.getElementById("reviewWrapper").style.display = "block";
  document.getElementById("toggleReviewBtn").innerText = "Hide Answer Review";
}

/************************************************
 * SCORE
 ************************************************/
function calculateScore() {
  score = 0;
  quizQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.ANSWER) score++;
  });
}

/************************************************
 * TOGGLE REVIEW
 ************************************************/
function toggleReview() {
  const wrap = document.getElementById("reviewWrapper");
  const btn = document.getElementById("toggleReviewBtn");

  if (wrap.style.display === "none") {
    wrap.style.display = "block";
    btn.innerText = "Hide Answer Review";
  } else {
    wrap.style.display = "none";
    btn.innerText = "Show Answer Review";
  }
}

/************************************************
 * BUILD REVIEW + SAVE DATA
 ************************************************/
function buildReview() {
  const review = document.getElementById("reviewSection");
  review.innerHTML = "";

  document.getElementById("finalScore").innerText =
    `${username}, Your Score: ${score} / ${quizQuestions.length}`;

  animateScoreRing();
  launchConfettiIfHighScore();
  saveResultToFirebase();

  quizQuestions.forEach((q, i) => {
    const block = document.createElement("div");
    block.style.margin = "12px 0";
    block.style.padding = "12px";
    block.style.borderRadius = "8px";
    block.style.border = "1px solid #ccc";
    block.style.background =
      userAnswers[i] === q.ANSWER ? "#e9f9ef" : "#fdecea";

    block.innerHTML = `
      <p><b>Q${i + 1}.</b> ${q.QUESTION}</p>
      <p>❓ Your Answer: ${getOptionText(q, userAnswers[i])}</p>
      <p>✅ Correct Answer: ${getOptionText(q, q.ANSWER)}</p>
    `;
    review.appendChild(block);
  });
}

/************************************************
 * HELPERS
 ************************************************/
function getOptionText(q, opt) {
  if (opt === 1) return "A. " + q.OPTION1;
  if (opt === 2) return "B. " + q.OPTION2;
  if (opt === 3) return "C. " + q.OPTION3;
  return "D. None of the above";
}

function goBack() {
  if (currentIndex > 0) {
    currentIndex--;
    loadQuestion();
  }
}

function goToQuestion(i) {
  currentIndex = i;
  loadQuestion();
}

/************************************************
 * SCORE RING
 ************************************************/
function animateScoreRing() {
  const percent = Math.round((score / quizQuestions.length) * 100);
  const circle = document.querySelector(".ring-progress");
  const text = document.getElementById("ringScore");

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset =
    circumference - (percent / 100) * circumference;

  let c = 0;
  const timer = setInterval(() => {
    if (c >= percent) clearInterval(timer);
    else text.innerText = ++c;
  }, 15);
}

/************************************************
 * CONFETTI (SAFE)
 ************************************************/
function launchConfettiIfHighScore() {
  if ((score / quizQuestions.length) * 100 < 60) return;
  if (typeof confetti === "function") {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }
}

/************************************************
 * FIREBASE SAVE
 ************************************************/
function saveResultToFirebase() {
  if (!window.db || !firebase?.firestore) {
    console.error("Firestore not initialized");
    return;
  }

  const detailedAnswers = quizQuestions.map((q, i) => ({
    question: q.QUESTION,
    correctAnswer: getOptionText(q, q.ANSWER),
    userAnswer: getOptionText(q, userAnswers[i]),
    isCorrect: userAnswers[i] === q.ANSWER
  }));

  db.collection("atl_results").add({
    name: username,
    score,
    total: quizQuestions.length,
    percentage: Math.round((score / quizQuestions.length) * 100),
    answers: detailedAnswers,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => console.log("Result saved successfully"))
  .catch(err => console.error("Firebase save error:", err));
}

/************************************************
 * EXPOSE FUNCTIONS (BUG FIX)
 ************************************************/
window.startQuiz = startQuiz;
window.selectOption = selectOption;
window.nextQuestion = nextQuestion;
window.goBack = goBack;
window.toggleReview = toggleReview;
