// PRISMA APP. 2026.

// Módulos y constantes
const QUESTIONS_URL = '/data/questions.json';
const STORAGE_KEY_UNLOCK = 'mathkids_unlocked_games';
const STORAGE_KEY_PROGRESS = 'mathkids_progress';

// Estado en memoria
let data = null;
let currentQuizId = null;
let currentQuestions = [];
let currentIndex = 0;
let unlockedGames = loadUnlockedGames();

// Sanitización del texto
function setText(el, text){
  el.textContent = String(text);
}

// Carga los cuestionarios del JSON.
async function loadQuestions(){
  try {
    const res = await fetch(QUESTIONS_URL, {cache: "no-store"});
    if(!res.ok) throw new Error('No se pudo cargar JSON');
    const json = await res.json();
    return json;
  } catch (e) {
    console.warn('No se pudo cargar las preguntas, usando fallback', e);
    return {
      cuestionarios: {}
    };
  }
}

// LocalStorage helpers
function loadUnlockedGames(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNLOCK);
    return raw ? JSON.parse(raw) : {1:false,2:false,3:false,4:false};
  } catch(e){
    return {1:false,2:false,3:false,4:false};
  }
}
function saveUnlockedGames(){
  localStorage.setItem(STORAGE_KEY_UNLOCK, JSON.stringify(unlockedGames));
}
function saveProgress(quizId, progressObj){
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS) || '{}');
  all[quizId] = progressObj;
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(all));
}

// UI helpers
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.add('d-none'));
  document.getElementById(id).classList.remove('d-none');

  const homeBtn = document.getElementById('btn-home');
  if(homeBtn){
    // Ocultar en la pantalla principal, mostrar en las demás
    if(id === 'screen-home'){
      homeBtn.classList.add('d-none');
    } else {
      homeBtn.classList.remove('d-none');
    }
  }
}

// Render lista de cuestionarios
function renderCuestionarios(){
  const list = document.getElementById('cuestionarios-list');
  list.innerHTML = '';
  const keys = Object.keys(data.cuestionarios || {});
  keys.forEach((key, idx) => {
    const q = data.cuestionarios[key];
    const card = document.createElement('div');
    card.className = 'd-flex align-items-center justify-content-between p-2 bg-white rounded shadow-sm';
    const left = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'fw-bold';
    setText(title, `${idx+1}. ${q.titulo || key}`);
    left.appendChild(title);
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-primary';
    setText(btn, 'Iniciar');
    btn.addEventListener('click', () => startQuiz(key));
    card.appendChild(left);
    card.appendChild(btn);
    list.appendChild(card);
  });
}

// Render lista de juegos 
function renderJuegos(){
  const list = document.getElementById('juegos-list');
  // Limpiar contenido previo
  while(list.firstChild) list.removeChild(list.firstChild);

  const gamesConfig = {
    "1": { "titulo": "Meme Madness", "imagen": "meme-madness-logo.jpeg", "url": "https://poki.com/es/g/meme-madness#fullscreen" },
    "2": { "titulo": "Carnado Stunt Car", "imagen": "carnado-stunt-car-logo.jpeg", "url": "https://poki.com/es/g/carnado-stunt-car#fullscreen" },
    "3": { "titulo": "Stickman Battle", "imagen": "stickman-battle-logo.png", "url": "https://poki.com/es/g/stickman-battle#fullscreen" },
    "4": { "titulo": "Happy Glass", "imagen": "happy-glass-logo.jpg", "url": "https://poki.com/es/g/happy-glass#fullscreen" }
  };

  // Generar 4 columnas para cada juego
  for(let i = 1; i <= 4; i++){
    const key = String(i);
    const g = gamesConfig[key] || { titulo: `Juego ${i}`, imagen: '', url: '' };
    const unlocked = !!(Array.isArray(unlockedGames) ? unlockedGames[i] : unlockedGames[key]);

    // Tile contenedor
    const tile = document.createElement('div');
    tile.className = 'd-flex flex-column align-items-center p-2 bg-white rounded shadow-sm';
    tile.style.width = '180px';
    tile.style.minHeight = '200px';
    tile.style.gap = '8px';
    tile.style.textAlign = 'center';

    // Imagen del juego
    const thumb = document.createElement('div');
    thumb.style.width = '100%';
    thumb.style.height = '150px';
    thumb.style.borderRadius = '8px';
    thumb.style.overflow = 'hidden';
    thumb.style.display = 'flex';
    thumb.style.alignItems = 'center';
    thumb.style.justifyContent = 'center';
    thumb.style.background = '#f0f4f8';

    if(g.imagen){
      const img = document.createElement('img');
      img.alt = g.titulo || `Juego ${i}`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      // carga segura del asset
      img.src = `assets/${encodeURIComponent(g.imagen)}`;
      thumb.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.textContent = g.titulo || `Juego ${i}`;
      ph.style.padding = '6px';
      ph.style.fontSize = '0.9rem';
      ph.style.color = '#6b7a86';
      thumb.appendChild(ph);
    }

    // Título
    const title = document.createElement('div');
    title.className = 'fw-bold';
    title.style.fontSize = '0.95rem';
    title.style.whiteSpace = 'nowrap';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.textContent = g.titulo || `Juego ${i}`;

    // Leyenda de estado
    const state = document.createElement('div');
    state.style.fontSize = '0.8rem';
    state.style.color = unlocked ? '#2e7d32' : '#b02a37';
    state.textContent = unlocked ? 'Desbloqueado' : 'Bloqueado';

    // Botones
    const btn = document.createElement('a');
    btn.className = 'btn btn-sm';
    btn.style.marginTop = '6px';
    btn.style.width = '100%';
    if(unlocked){
      btn.classList.add('btn-success');
      btn.textContent = 'Jugar';
      btn.href = g.url;
      btn.target = '_blank';
    } else {
      btn.classList.add('btn-outline-secondary');
      btn.href = '#';
      btn.textContent = 'Bloqueado';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Swal.fire({
          icon: 'info',
          title: 'Juego bloqueado',
          text: 'Debes resolver un cuestionario para desbloquearlo.'
        });
      });
    }

    // Insertar cada juego
    tile.appendChild(thumb);
    tile.appendChild(title);
    tile.appendChild(state);
    tile.appendChild(btn);

    // Añadir margen entre cada juego
    tile.style.margin = '6px';

    list.appendChild(tile);
  }
}

// Iniciar cuestionario
function startQuiz(quizId){
  currentQuizId = quizId;
  const quiz = data.cuestionarios[quizId];
  currentQuestions = Object.entries(quiz.preguntas || {}).map(([id, q]) => ({id, ...q}));
  currentIndex = 0;
  setText(document.getElementById('quiz-title'), quiz.titulo || 'Cuestionario');
  renderQuestion();
  showScreen('screen-quiz');
}

// Render de una pregunta (pantalla única que se actualiza dinámicamente)
function renderQuestion(){
  const q = currentQuestions[currentIndex];
  setText(document.getElementById('progress'), `Pregunta ${currentIndex+1}/${currentQuestions.length}`);
  const imgArea = document.getElementById('question-image');
  imgArea.innerHTML = '';
  if(q.imagen){
    const img = document.createElement('img');
    img.alt = 'Pregunta';
    // Carga segura de imagen (para evitar inyecciones y cosas así)
    img.src = `assets/${encodeURIComponent(q.imagen)}`;
    imgArea.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    setText(placeholder, 'Aquí irá la imagen de la pregunta');
    imgArea.appendChild(placeholder);
  }
  document.getElementById('answer-input').value = '';
}

// Comprobar respuesta
function checkAnswer(){
  const q = currentQuestions[currentIndex];
  const raw = document.getElementById('answer-input').value.trim();
  const user = raw.replace(/\s+/g,'').toLowerCase();

  // Se normaliza para evitar burradas como las de Pearson y de otras plataformas de matemáticas
  let expectedList = [];
  if(Array.isArray(q.respuestas)){
    expectedList = q.respuestas.map(r => String(r).replace(/\s+/g,'').toLowerCase());
  } else if(q.respuesta){
    expectedList = [String(q.respuesta).replace(/\s+/g,'').toLowerCase()];
  }

  // Validar contra el array de las respuestas posibles
  const isCorrect = expectedList.includes(user);

  if(isCorrect){
    Swal.fire({
      icon: 'success',
      title: '¡Respuesta correcta!',
      showConfirmButton: false,
      timer: 1500
    }).then(() => {
      if(currentIndex < currentQuestions.length - 1){
        currentIndex++;
        renderQuestion();
      } else {
        completeQuiz();
      }
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Respuesta incorrecta',
      html: `<p>${escapeHtml(q.recomendacion || 'Si lo necesitas, pide ayuda a tu asesor por WhatsApp.')}</p>`
    });
  }
}

// Escapar texto
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Completa el cuestionario y desbloquea el juego
function completeQuiz(){
  // El cuestionario 1 desbloquea el juego 1, el cuestionario 2 desbloquea el juego 2, y así sucesivamente
  const quizKeys = Object.keys(data.cuestionarios || {});
  const idx = quizKeys.indexOf(currentQuizId);
  if(idx >= 0 && idx < 4){
    unlockedGames[idx+1] = true;
    saveUnlockedGames();
  }
  saveProgress(currentQuizId, {completed: true, date: new Date().toISOString()});
  setText(document.getElementById('complete-msg'), 'Has completado el cuestionario. Se desbloqueó un juego.');
  renderJuegos();
  showScreen('screen-quiz-complete');
}

// Navegación y eventos
function setupEvents(){
  document.getElementById('btn-check').addEventListener('click', checkAnswer);
  document.getElementById('btn-exit-quiz').addEventListener('click', () => {
    Swal.fire({
      title: 'Salir del cuestionario',
      text: '¿Deseas salir? Tu progreso para este cuestionario se perderá.',
      showCancelButton: true
    }).then(res => {
      if(res.isConfirmed) showScreen('screen-home');
    });
  });
  document.getElementById('btn-back-home').addEventListener('click', () => showScreen('screen-home'));
  document.getElementById('btn-home').addEventListener('click', () => showScreen('screen-home'));
    document.getElementById('app-logo').addEventListener('click', () => showScreen('screen-home'));
}

// Inicialización
async function init(){
  data = await loadQuestions();
  renderCuestionarios();
  renderJuegos();
  setupEvents();
  showScreen('screen-home');
}

document.addEventListener('DOMContentLoaded', init);

