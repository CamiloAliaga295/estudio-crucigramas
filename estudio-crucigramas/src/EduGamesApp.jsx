// EduGamesApp: Plataforma de juegos educativos basada en conceptos/definiciones
// Nota: demo 100% en cliente. Login localStorage, suscripción simulada, y carga de JSON.
// Puedes ocultar el botón de carga JSON cambiando la constante SHOW_JSON_UPLOAD a false.

import React, { useEffect, useMemo, useRef, useState } from 'react';

// ===================== CONFIG =====================
const SHOW_JSON_UPLOAD = false; // ponlo en false antes de entregar al cliente

// Tipos de dato (JS Doc para claridad)
/**
 * @typedef {{ concepto?: string, concepto_clave?: string, definicion: string, definición?: string, tema: string }} RawItem
 * @typedef {{ concepto: string, definicion: string, tema: string }} Item
 * @typedef {{ username: string, passwordHash: string, subscriptionActive: boolean }} User
 * @typedef {{ game: string, theme: string, score: number, timestamp: number }} ScoreEntry
 */

// Dataset de ejemplo mínimo (6 asignaturas) para probar si no suben JSON
const SAMPLE_DATA /** @type {Item[]} */ = [
  { concepto: 'Átomo', definicion: 'Unidad básica de la materia que conserva sus propiedades.', tema: 'Química: Estructura atómica' },
  { concepto: 'Enlace iónico', definicion: 'Atracción electrostática entre iones de carga opuesta.', tema: 'Química: Enlaces' },
  { concepto: 'Fotosíntesis', definicion: 'Proceso por el cual las plantas convierten luz en energía química.', tema: 'Biología: Procesos vitales' },
  { concepto: 'Masa', definicion: 'Medida de la cantidad de materia de un cuerpo.', tema: 'Física: Magnitudes' },
  { concepto: 'Velocidad', definicion: 'Relación entre desplazamiento y tiempo.', tema: 'Física: Cinemática' },
  { concepto: 'Derivada', definicion: 'Tasa de cambio instantánea de una función.', tema: 'Matemática: Cálculo' },
  { concepto: 'Metáfora', definicion: 'Figura retórica que traslada el sentido de una palabra a otra.', tema: 'Comprensión Lectora: Figuras retóricas' },
  { concepto: 'Imperio Romano', definicion: 'Estado que sucedió a la República y dominó el Mediterráneo.', tema: 'Ciencias Sociales: Historia' },
  { concepto: 'Hipotenusa', definicion: 'El lado mayor de un triángulo rectángulo, opuesto al ángulo recto.', tema: 'Matemática: Geometría' },
  { concepto: 'Ecosistema', definicion: 'Conjunto de organismos y el entorno con el que interactúan.', tema: 'Biología: Ecología' },
];

// ===================== UTILIDADES =====================
const normalize = (s) => (s || '')
  .toString()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/[^A-Za-zÁÉÍÓÚÜÑ0-9]/giu, '')
  .toUpperCase();

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const range = (n) => Array.from({ length: n }, (_, i) => i);

// Derivar asignatura desde el prefijo "Tema: X: Y" → asignatura = X
const subjectFromTheme = (tema) => {
  if (!tema) return 'General';
  const idx = tema.indexOf(':');
  return idx > -1 ? tema.slice(0, idx).trim() : 'General';
};

// ===================== PERSISTENCIA =====================
const LS_KEYS = {
  users: 'edu_users_v1',
  session: 'edu_session_v1',
  scores: 'edu_scores_v1',
  dataset: 'edu_dataset_v1',
};

const getUsers = () => JSON.parse(localStorage.getItem(LS_KEYS.users) || '[]');
const setUsers = (users) => localStorage.setItem(LS_KEYS.users, JSON.stringify(users));

const getScores = () => JSON.parse(localStorage.getItem(LS_KEYS.scores) || '[]');
const setScores = (scores) => localStorage.setItem(LS_KEYS.scores, JSON.stringify(scores));

const getSession = () => JSON.parse(localStorage.getItem(LS_KEYS.session) || 'null');
const setSession = (u) => localStorage.setItem(LS_KEYS.session, JSON.stringify(u));

const getDataset = () => JSON.parse(localStorage.getItem(LS_KEYS.dataset) || 'null');
const setDataset = (data) => localStorage.setItem(LS_KEYS.dataset, JSON.stringify(data));

// ===================== COMPONENTE PRINCIPAL =====================
export default function EduGamesApp() {
  const [rawData, setRawData] = useState(() => getDataset() || initialData || SAMPLE_DATA);
  const [currentUser, setCurrentUser] = useState(() => getSession());
  const [subject, setSubject] = useState('Todas');
  const [theme, setTheme] = useState('');
  const [view, setView] = useState('menu'); // 'menu' | nombre del juego | 'auth' | 'sub'

  // Normalizar dataset a {concepto, definicion, tema}
  const dataset = useMemo(() => {
    const mapOne = (r) => /** @type {Item} */ ({
      concepto: r.concepto ?? r.concepto_clave ?? '',
      definicion: r.definicion ?? r.definición ?? '',
      tema: r.tema ?? 'General',
    });
    const arr = (rawData || []).map(mapOne).filter(x => x.concepto && x.definicion);
    return arr.length ? arr : SAMPLE_DATA;
  }, [rawData]);

  useEffect(() => setDataset(dataset), [dataset]);

  // Lista de temas y asignaturas
  const subjects = useMemo(() => {
    const s = new Set(dataset.map(d => subjectFromTheme(d.tema)));
    return ['Todas', ...Array.from(s).sort()];
  }, [dataset]);

  const themes = useMemo(() => {
    const filtered = subject === 'Todas' ? dataset : dataset.filter(d => subjectFromTheme(d.tema) === subject);
    const s = new Set(filtered.map(d => d.tema));
    const list = Array.from(s).sort();
    if (!list.includes(theme)) setTheme('');
    return list;
  }, [dataset, subject]);

  const themeData = useMemo(() => dataset.filter(d => (theme ? d.tema === theme : true)), [dataset, theme]);

  const onUploadJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error('El JSON debe ser un arreglo de objetos.');
        setRawData(arr);
        alert('Dataset cargado con éxito.');
      } catch (e) {
        alert('Error al leer JSON: ' + e.message);
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentUser(null);
  };

  const mustBeLogged = (nextView) => {
    if (!currentUser) {
      setView('auth');
      return false;
    }
    setView(nextView);
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-black text-xl">Crucigramas • Juegos EDU</div>
          <nav className="ml-auto flex items-center gap-2">
            <button className={`px-3 py-1.5 rounded-lg ${view==='menu'?'bg-slate-900 text-white':'bg-slate-100 hover:bg-slate-200'}`} onClick={()=>setView('menu')}>Menú</button>
            <button className={`px-3 py-1.5 rounded-lg ${view==='sub'?'bg-slate-900 text-white':'bg-slate-100 hover:bg-slate-200'}`} onClick={()=>setView('sub')}>Suscripción</button>
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">👤 {currentUser.username} {currentUser.subscriptionActive ? '• ⭐ Suscrito' : '• Gratis'}</span>
                <button className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200" onClick={handleLogout}>Salir</button>
              </div>
            ) : (
              <button className={`px-3 py-1.5 rounded-lg ${view==='auth'?'bg-slate-900 text-white':'bg-slate-100 hover:bg-slate-200'}`} onClick={()=>setView('auth')}>Ingresar</button>
            )}
            {SHOW_JSON_UPLOAD && (
              <label className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 cursor-pointer">Cargar JSON
                <input type="file" accept="application/json" className="hidden" onChange={(e)=>e.target.files?.[0] && onUploadJSON(e.target.files[0])} />
              </label>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'menu' && (
          <MainMenu
            subjects={subjects}
            subject={subject}
            setSubject={setSubject}
            themes={themes}
            theme={theme}
            setTheme={setTheme}
            go={(v)=>mustBeLogged(v)}
            datasetCount={theme ? themeData.length : dataset.length}
          />
        )}

        {view === 'auth' && (
          <AuthPanel onLogin={(u)=>{ setCurrentUser(u); setView('menu'); }} />
        )}

        {view === 'sub' && currentUser && (
          <SubscriptionPanel currentUser={currentUser} onChange={(u)=>{ setCurrentUser(u); setSession(u); }} />
        )}
        {view === 'sub' && !currentUser && (
          <p className="text-slate-600">Inicia sesión para gestionar tu suscripción.</p>
        )}

        {view === 'crucigrama' && (
          <Crossword setup={{ data: theme ? themeData : dataset }} onBack={()=>setView('menu')} currentUser={currentUser} />
        )}
        {view === 'parejas' && (
          <MatchPairs setup={{ data: theme ? themeData : dataset }} onBack={()=>setView('menu')} currentUser={currentUser} />
        )}
        {view === 'quiz' && (
          <QuizGame setup={{ data: theme ? themeData : dataset }} onBack={()=>setView('menu')} currentUser={currentUser} />
        )}
        {view === 'flashcards' && (
          <Flashcards setup={{ data: theme ? themeData : dataset }} onBack={()=>setView('menu')} />
        )}
        {view === 'sopa' && (
          <WordSearch setup={{ data: theme ? themeData : dataset }} onBack={()=>setView('menu')} currentUser={currentUser} />
        )}
        {view === 'vf' && (
          <TrueFalseGame setup={{ data: theme ? themeData : dataset }} onBack={()=>setView('menu')} currentUser={currentUser} />
        )}
        {view === 'memoria' && (
          <MemoryGame setup={{ data: theme ? themeData : dataset }} onBack={()=>setView('menu')} currentUser={currentUser} />
        )}
      </main>

      <footer className="border-t border-slate-200 text-center text-xs text-slate-500 py-4">
        Demo educativa • Base JSON común • LocalStorage • {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// ===================== MENÚ PRINCIPAL =====================
function MainMenu({ subjects, subject, setSubject, themes, theme, setTheme, go, datasetCount }){
  const GameCard = ({ id, title, desc }) => (
    <button onClick={()=>go(id)} className="w-full text-left p-4 rounded-2xl bg-white shadow hover:shadow-md border border-slate-200 transition">
      <div className="font-bold text-lg">{title}</div>
      <div className="text-sm text-slate-600">{desc}</div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow">
          <div className="font-semibold mb-2">Asignatura</div>
          <select className="w-full p-2 rounded-lg border" value={subject} onChange={(e)=>setSubject(e.target.value)}>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="mt-4 font-semibold mb-2">Tema</div>
          <select className="w-full p-2 rounded-lg border" value={theme} onChange={(e)=>setTheme(e.target.value)}>
            <option value="">Todos</option>
            {themes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="mt-3 text-xs text-slate-500">Conceptos disponibles: {datasetCount}</div>
        </div>
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
          <div className="font-semibold mb-1">Base JSON</div>
          <p className="text-sm text-emerald-900">Todos los juegos usan la misma base. Carga tu archivo en el encabezado. Claves aceptadas: <code>concepto</code> o <code>concepto_clave</code>, <code>definicion</code> o <code>definición</code>, <code>tema</code>.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GameCard id="crucigrama" title="Crucigrama" desc="Completa conceptos a partir de definiciones. Tamaño variable, numeración correlativa." />
        <GameCard id="parejas" title="Une las parejas" desc="Arrastra conceptos hacia sus definiciones. Controla la cantidad." />
        <GameCard id="quiz" title="Cuestionario" desc="4 opciones basadas en definiciones. Con o sin tiempo." />
        <GameCard id="flashcards" title="Tarjetas" desc="Estudia: concepto ↔ definición. Sin puntaje." />
        <GameCard id="sopa" title="Sopa de letras" desc="Resalta conceptos y ve su definición al encontrarlos." />
        <GameCard id="vf" title="Verdadero o falso" desc="Evalúa afirmaciones generadas del banco." />
        <GameCard id="memoria" title="Memorice" desc="Empareja concepto y definición contra reloj." />
      </div>
    </div>
  );
}

// ===================== AUTH & SUBSCRIPCIÓN =====================
function AuthPanel({ onLogin }){
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const hash = (s) => btoa(unescape(encodeURIComponent(s)));

  const doLogin = () => {
    const users = getUsers();
    const u = users.find(x => x.username === username && x.passwordHash === hash(password));
    if (u) {
      setSession(u); onLogin(u);
    } else {
      setMsg('Usuario o contraseña incorrecta.');
    }
  };

  const doRegister = () => {
    const users = getUsers();
    if (users.some(x => x.username === username)) { setMsg('El usuario ya existe.'); return; }
    const u = { username, passwordHash: hash(password), subscriptionActive: false };
    users.push(u); setUsers(users); setSession(u); onLogin(u);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border shadow">
      <div className="flex gap-2 mb-4">
        <button className={`px-3 py-1.5 rounded-lg ${mode==='login'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setMode('login')}>Ingresar</button>
        <button className={`px-3 py-1.5 rounded-lg ${mode==='register'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setMode('register')}>Crear cuenta</button>
      </div>
      <input className="w-full p-2 border rounded-lg mb-2" placeholder="Usuario" value={username} onChange={(e)=>setUsername(e.target.value)} />
      <input className="w-full p-2 border rounded-lg mb-2" placeholder="Contraseña" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button className="w-full py-2 rounded-lg bg-slate-900 text-white" onClick={mode==='login'?doLogin:doRegister}>{mode==='login'?'Ingresar':'Registrarme'}</button>
      {msg && <p className="text-rose-600 text-sm mt-2">{msg}</p>}
      <p className="text-xs text-slate-500 mt-4">Demo: cuentas y sesión locales. No se envían datos.</p>
    </div>
  );
}

function SubscriptionPanel({ currentUser, onChange }){
  const [active, setActive] = useState(!!currentUser.subscriptionActive);

  const toggle = () => {
    const users = getUsers();
    const u = users.find(x => x.username === currentUser.username);
    if (u) { u.subscriptionActive = !active; setUsers(users); }
    const updated = { ...currentUser, subscriptionActive: !active };
    onChange(updated);
    setActive(!active);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl border shadow space-y-3">
      <h2 className="font-bold text-lg">Suscripción</h2>
      <p className="text-sm text-slate-600">Demo local. Aquí se integraría Stripe/Transbank (checkout). El botón alterna el estado de suscripción para pruebas.</p>
      <div className="flex items-center gap-3">
        <span>Estado: {active ? '⭐ Activa' : 'Gratis'}</span>
        <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white" onClick={toggle}>{active ? 'Desactivar (demo)' : 'Activar (demo)'}</button>
      </div>
    </div>
  );
}

// ===================== SISTEMA DE PUNTAJES =====================
function addScore(username, game, theme, score) {
  const scores = getScores();
  scores.push({ game, theme, score, timestamp: Date.now(), username });
  setScores(scores);
}

function ScoreBadge({ game }){
  const [sum, setSum] = useState(0);
  useEffect(() => {
    const scores = getScores().filter(s => s.game === game);
    const total = scores.reduce((a,b)=>a+b.score,0);
    setSum(total);
  }, [game]);
  return <span className="text-xs text-slate-500">Puntos globales "{game}": {sum}</span>;
}

// ===================== JUEGO: CRUCIGRAMA =====================
function Crossword({ setup, onBack, currentUser }){
  const [size, setSize] = useState(12);
  const [grid, setGrid] = useState(null); // {cells, cluesAcross, cluesDown, answers}
  const [completed, setCompleted] = useState(false);

  const words = useMemo(()=> {
    const list = setup.data.map(x => ({ word: normalize(x.concepto), raw: x.concepto, clue: x.definicion }));
    // quitar duplicados y vacíos
    const unique = [];
    const seen = new Set();
    for (const w of list) { if (w.word && !seen.has(w.word)) { unique.push(w); seen.add(w.word); } }
    return unique;
  }, [setup]);

  const build = () => {
    const N = Math.max(6, Math.min(22, size|0));
    const empty = Array.from({length:N}, ()=>Array.from({length:N}, ()=>({ ch: '', fixed:false })));

    // Algoritmo simple: coloca palabras intentando cruzarlas por letras coincidentes.
    const placed = [];

    const placeAt = (w, r, c, dir) => { // dir: 'H'|'V'
      if (dir==='H') {
        if (c < 0 || c + w.word.length > N) return false;
        for (let i=0;i<w.word.length;i++){
          const cell = empty[r][c+i];
          if (cell.ch && cell.ch !== w.word[i]) return false;
          // bordes de palabra: evitar letras adyacentes que formen óvalo ilegal
          if (cell.ch===''){
            if (r>0 && empty[r-1][c+i].ch) return false;
            if (r<N-1 && empty[r+1][c+i].ch) return false;
          }
        }
        // extremos
        if (c>0 && empty[r][c-1].ch) return false;
        if (c + w.word.length < N && empty[r][c + w.word.length].ch) return false;
        for (let i=0;i<w.word.length;i++){ empty[r][c+i].ch = w.word[i]; }
        placed.push({ ...w, r, c, dir });
        return true;
      } else {
        if (r < 0 || r + w.word.length > N) return false;
        for (let i=0;i<w.word.length;i++){
          const cell = empty[r+i][c];
          if (cell.ch && cell.ch !== w.word[i]) return false;
          if (cell.ch===''){
            if (c>0 && empty[r+i][c-1].ch) return false;
            if (c<N-1 && empty[r+i][c+1].ch) return false;
          }
        }
        if (r>0 && empty[r-1][c].ch) return false;
        if (r + w.word.length < N && empty[r + w.word.length][c].ch) return false;
        for (let i=0;i<w.word.length;i++){ empty[r+i][c].ch = w.word[i]; }
        placed.push({ ...w, r, c, dir });
        return true;
      }
    };

    const tryCross = (w) => {
      // intenta cruzar con alguna colocada
      for (const p of shuffle(placed)){
        for (let i=0;i<w.word.length;i++){
          const ch = w.word[i];
          for (let j=0;j<p.word.length;j++){
            if (p.word[j] !== ch) continue;
            if (p.dir==='H'){
              const r = p.r - i;
              const c = p.c + j;
              if (placeAt(w, r, c, 'V')) return true;
            } else {
              const r = p.r + j;
              const c = p.c - i;
              if (placeAt(w, r, c, 'H')) return true;
            }
          }
        }
      }
      return false;
    };

    const sorted = shuffle(words).sort((a,b)=>b.word.length - a.word.length);
    // Colocar primera palabra en el centro
    const first = sorted[0];
    if (!first) return;
    placeAt(first, Math.floor(N/2), Math.max(0, Math.floor(N/2 - first.word.length/2)), 'H');

    for (const w of sorted.slice(1)){
      if (!tryCross(w)){
        // prueba posiciones al azar
        let placedFlag = false;
        for (let t=0;t<200;t++){
          const dir = Math.random() < 0.5 ? 'H' : 'V';
          const r = Math.floor(Math.random()*N);
          const c = Math.floor(Math.random()*N);
          if (placeAt(w, r, c, dir)) { placedFlag = true; break; }
        }
        if (!placedFlag) {
          // si no cabe, se omite
        }
      }
    }

    // Generar numeración correlativa y celdas del usuario
    const cells = empty.map(row => row.map(cell => ({ ...cell, user: cell.ch ? '' : '', block: cell.ch===''? false : false })));

    const numbers = Array.from({length:N}, ()=>Array.from({length:N}, ()=>0));
    let num = 1;
    const cluesAcross = [];
    const cluesDown = [];

    // asignar números de inicio de palabra (Across/Down)
    for (let r=0;r<N;r++){
      for (let c=0;c<N;c++){
        const ch = empty[r][c].ch;
        if (!ch) continue;
        // Inicio horizontal
        const startH = (c===0 || !empty[r][c-1].ch) && (c<N-1 && empty[r][c+1].ch);
        const startV = (r===0 || !empty[r-1][c].ch) && (r<N-1 && empty[r+1][c].ch);
        if (startH || startV){ numbers[r][c] = num++; }
      }
    }

    // construir pistas
    const toWord = (r,c,dir) => {
      let s = '';
      let i=0;
      if (dir==='H'){
        while (c+i<N && empty[r][c+i].ch){ s += empty[r][c+i].ch; i++; }
      } else {
        while (r+i<N && empty[r+i][c].ch){ s += empty[r+i][c].ch; i++; }
      }
      return s;
    };

    for (let r=0;r<N;r++){
      for (let c=0;c<N;c++){
        if (!empty[r][c].ch) continue;
        const n = numbers[r][c];
        if (!n) continue;
        // Across
        if ((c===0 || !empty[r][c-1].ch) && (c<N-1 && empty[r][c+1].ch)){
          const ans = toWord(r,c,'H');
          const ref = words.find(w=>w.word===ans);
          cluesAcross.push({ n, clue: ref?.clue || '—', answer: ans });
        }
        // Down
        if ((r===0 || !empty[r-1][c].ch) && (r<N-1 && empty[r+1][c].ch)){
          const ans = toWord(r,c,'V');
          const ref = words.find(w=>w.word===ans);
          cluesDown.push({ n, clue: ref?.clue || '—', answer: ans });
        }
      }
    }

    setGrid({ N, cells, numbers, cluesAcross: cluesAcross.sort((a,b)=>a.n-b.n), cluesDown: cluesDown.sort((a,b)=>a.n-b.n) });
    setCompleted(false);
  };

  useEffect(()=>{ build(); /* auto al entrar */ }, []);

  const onType = (r,c,val) => {
    if (!grid) return;
    const v = (val||'').slice(-1).toUpperCase();
    setGrid(prev => {
      const g = { ...prev, cells: prev.cells.map(row => row.map(cell => ({...cell}))) };
      if (g.cells[r][c].ch){ g.cells[r][c].user = v; }
      return g;
    });
  };

  useEffect(()=>{
    if (!grid) return;
    const done = grid.cells.every((row, r)=> row.every((cell, c)=>{
      return !cell.ch || (cell.user && normalize(cell.user) === cell.ch);
    }));
    setCompleted(done);
  }, [grid]);

  const scoreAndBack = () => {
    if (currentUser) addScore(currentUser.username, 'Crucigrama', '—', completed ? 100 : 10);
    onBack();
  };

  if (!grid) return <p>Cargando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm">Tamaño</label>
          <input type="number" min={6} max={22} value={size} onChange={(e)=>setSize(parseInt(e.target.value||'12'))} className="ml-2 w-20 p-1 border rounded" />
          <button className="ml-2 px-3 py-1.5 rounded bg-slate-900 text-white" onClick={build}>Generar</button>
        </div>
        <ScoreBadge game="Crucigrama" />
        <button className="ml-auto px-3 py-1.5 rounded bg-slate-100" onClick={scoreAndBack}>Volver</button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="inline-grid" style={{ gridTemplateColumns: `repeat(${grid.N}, 2rem)` }}>
            {range(grid.N).map(r => range(grid.N).map(c => {
              const cell = grid.cells[r][c];
              const num = grid.numbers[r][c];
              const isActive = !!cell.ch;
              return (
                <div key={`${r}-${c}`} className={`relative w-8 h-8 border ${isActive?'bg-white':'bg-slate-300'}`}>
                  {num ? <span className="absolute -mt-1 -ml-1 text-[10px] text-slate-500">{num}</span> : null}
                  {isActive ? (
                    <input value={cell.user||''} onChange={(e)=>onType(r,c,e.target.value)} maxLength={1} className="w-full h-full text-center uppercase font-semibold focus:outline-none" />
                  ) : null}
                </div>
              );
            }))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="font-bold">Horizontales</div>
            <ol className="list-decimal ml-5 space-y-1">
              {grid.cluesAcross.map(cl => <li key={`A${cl.n}`}>{cl.n}. {cl.clue}</li>)}
            </ol>
          </div>
          <div>
            <div className="font-bold">Verticales</div>
            <ol className="list-decimal ml-5 space-y-1">
              {grid.cluesDown.map(cl => <li key={`D${cl.n}`}>{cl.n}. {cl.clue}</li>)}
            </ol>
          </div>
          {completed && <div className="p-3 rounded bg-emerald-100 text-emerald-900">¡Completado! Puntaje máximo asignado.</div>}
        </div>
      </div>
    </div>
  );
}

// ===================== JUEGO: UNE LAS PAREJAS =====================
function MatchPairs({ setup, onBack, currentUser }){
  const [count, setCount] = useState(6);
  const pairs = useMemo(()=> shuffle(setup.data).slice(0, Math.max(2, Math.min(12, count))), [setup, count]);
  const [matches, setMatches] = useState({}); // key: concepto → definicion
  const [score, setScore] = useState(0);

  const left = pairs.map(p => p.concepto);
  const right = shuffle(pairs.map(p => p.definicion));

  const onDrop = (concepto, definicion) => {
    setMatches(prev => ({ ...prev, [concepto]: definicion }));
  };

  useEffect(()=>{
    const ok = pairs.filter(p => matches[p.concepto] === p.definicion).length;
    setScore(ok);
  }, [matches]);

  const finish = () => {
    if (currentUser) addScore(currentUser.username, 'Parejas', '—', score * 10);
    onBack();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm">Nº de parejas</label>
          <input type="number" min={2} max={12} value={count} onChange={(e)=>setCount(parseInt(e.target.value||'6'))} className="ml-2 w-24 p-1 border rounded" />
        </div>
        <div className="ml-auto font-semibold">✅ Correctas: {score}/{pairs.length}</div>
        <ScoreBadge game="Parejas" />
        <button className="px-3 py-1.5 rounded bg-slate-100" onClick={finish}>Volver</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-3 bg-white rounded-2xl border">
          <div className="font-semibold mb-2">Conceptos (arrastra)</div>
          <div className="space-y-2">
            {left.map(c => (
              <div key={c} draggable onDragStart={(e)=>e.dataTransfer.setData('text/plain', c)} className="p-2 bg-slate-100 rounded-lg cursor-grab active:cursor-grabbing">{c}</div>
            ))}
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border">
          <div className="font-semibold mb-2">Definiciones (suelta aquí)</div>
          <div className="space-y-3">
            {right.map(d => (
              <div key={d} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{ const c = e.dataTransfer.getData('text/plain'); if (c) onDrop(c, d); }} className="p-2 bg-amber-50 rounded-lg min-h-12 border">
                <div className="text-sm">{d}</div>
                {Object.entries(matches).find(([k,v])=>v===d) && (
                  <div className="mt-2 text-xs text-emerald-700">→ {Object.entries(matches).find(([k,v])=>v===d)[0]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== JUEGO: QUIZ =====================
function QuizGame({ setup, onBack, currentUser }){
  const [timed, setTimed] = useState(false);
  const [num, setNum] = useState(8);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const questions = useMemo(()=>{
    const base = shuffle(setup.data).slice(0, Math.max(2, Math.min(30, num)));
    return base.map(q => {
      const distractores = shuffle(setup.data.filter(x=>x.concepto!==q.concepto)).slice(0,3).map(x=>x.definicion);
      const options = shuffle([q.definicion, ...distractores]);
      return { concepto: q.concepto, definicion: q.definicion, options };
    });
  }, [setup, num, started]);

  useEffect(()=>{
    if (!started || !timed) return;
    if (timeLeft <= 0) return;
    const t = setTimeout(()=> setTimeLeft(timeLeft - 1), 1000);
    return ()=>clearTimeout(t);
  }, [started, timed, timeLeft]);

  const start = () => {
    setStarted(true); setIdx(0); setScore(0);
    if (timed) setTimeLeft(60);
  };

  const answer = (opt) => {
    if (timed && timeLeft<=0) return;
    const q = questions[idx];
    if (opt === q.definicion) setScore(s=>s+10);
    if (idx < questions.length-1) setIdx(i=>i+1); else finish();
  };

  const finish = () => {
    if (currentUser) addScore(currentUser.username, 'Quiz', '—', score);
    onBack();
  };

  if (!started) return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm">Preguntas</label>
          <input type="number" min={2} max={30} value={num} onChange={(e)=>setNum(parseInt(e.target.value||'8'))} className="ml-2 w-24 p-1 border rounded" />
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={timed} onChange={(e)=>setTimed(e.target.checked)} /> Contra el tiempo (60 s)</label>
        <ScoreBadge game="Quiz" />
        <button className="ml-auto px-3 py-1.5 rounded bg-slate-100" onClick={onBack}>Volver</button>
      </div>
      <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white" onClick={start}>Comenzar</button>
    </div>
  );

  const q = questions[idx];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="font-semibold">Puntaje: {score}</div>
        {timed && <div className={`ml-2 px-2 py-1 rounded ${timeLeft<10?'bg-rose-100':'bg-slate-100'}`}>⏱️ {timeLeft}s</div>}
        <div className="ml-auto text-sm">{idx+1}/{questions.length}</div>
      </div>
      <div className="p-4 bg-white rounded-2xl border">
        <div className="text-slate-600 text-sm mb-1">Definición de:</div>
        <div className="font-bold text-lg">{q.concepto}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {q.options.map(opt => (
          <button key={opt} onClick={()=>answer(opt)} className="p-3 bg-white rounded-xl border hover:bg-slate-50 text-left">{opt}</button>
        ))}
      </div>
    </div>
  );
}

// ===================== JUEGO: FLASHCARDS =====================
function Flashcards({ setup, onBack }){
  const cards = useMemo(()=> shuffle(setup.data), [setup]);
  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);

  const next = () => { setFlip(false); setIdx((idx+1)%cards.length); };

  const c = cards[idx];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-500">{idx+1}/{cards.length}</div>
        <button className="ml-auto px-3 py-1.5 rounded bg-slate-100" onClick={onBack}>Volver</button>
      </div>
      <div className="p-6 bg-white rounded-2xl border shadow text-center cursor-pointer select-none" onClick={()=>setFlip(f=>!f)}>
        <div className="text-slate-500 text-xs mb-2">Toca para girar</div>
        <div className="text-xl font-bold">{flip ? c.definicion : c.concepto}</div>
      </div>
      <div className="flex justify-center"><button className="px-4 py-2 rounded-lg bg-indigo-600 text-white" onClick={next}>Siguiente</button></div>
    </div>
  );
}

// ===================== JUEGO: SOPA DE LETRAS =====================
function WordSearch({ setup, onBack, currentUser }){
  const [size, setSize] = useState(12);
  const [selectionCount, setSelectionCount] = useState(8);
  const [board, setBoard] = useState(null);
  const [found, setFound] = useState([]);
  const [panelText, setPanelText] = useState('');
  const [drag, setDrag] = useState(null); // {r,c}

  const words = useMemo(()=> shuffle(setup.data).slice(0, Math.max(3, Math.min(20, selectionCount))), [setup, selectionCount]);

  const build = () => {
    const N = Math.max(6, Math.min(20, size|0));
    const grid = Array.from({length:N}, ()=>Array.from({length:N}, ()=>''));
    const placements = [];

    const tryPlace = (w, dir) => { // 'H' | 'V'
      const W = normalize(w.concepto);
      for (let attempts=0; attempts<200; attempts++){
        if (dir==='H'){
          const r = Math.floor(Math.random()*N);
          const c = Math.floor(Math.random()*(N - W.length + 1));
          let ok = true;
          for (let i=0;i<W.length;i++){
            const ch = grid[r][c+i];
            if (ch && ch !== W[i]) { ok=false; break; }
          }
          if (ok){ for (let i=0;i<W.length;i++){ grid[r][c+i] = W[i]; } placements.push({ word: W, r, c, dir:'H', raw:w }); return true; }
        } else {
          const r = Math.floor(Math.random()*(N - W.length + 1));
          const c = Math.floor(Math.random()*N);
          let ok = true;
          for (let i=0;i<W.length;i++){
            const ch = grid[r+i][c];
            if (ch && ch !== W[i]) { ok=false; break; }
          }
          if (ok){ for (let i=0;i<W.length;i++){ grid[r+i][c] = W[i]; } placements.push({ word: W, r, c, dir:'V', raw:w }); return true; }
        }
      }
      return false;
    };

    for (const w of words){
      if (!tryPlace(w, Math.random()<0.5?'H':'V')){
        // si no cabe en una, prueba la otra
        tryPlace(w, 'H') || tryPlace(w, 'V');
      }
    }

    // rellenar
    const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    for (let r=0;r<N;r++) for (let c=0;c<N;c++) if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(Math.random()*alphabet.length)];

    setBoard({ N, grid, placements });
    setFound([]);
    setPanelText('');
  };

  useEffect(()=>{ build(); }, []);

  const onMouseDown = (r,c) => setDrag({ r,c });
  const onMouseUp = (r2,c2) => {
    if (!drag || !board) return;
    const { r, c } = drag;
    if (r!==r2 && c!==c2) { setDrag(null); return; } // sólo H/V
    let word='';
    if (r===r2){
      const [a,b] = c<=c2 ? [c,c2] : [c2,c];
      for (let i=a;i<=b;i++) word += board.grid[r][i];
    } else {
      const [a,b] = r<=r2 ? [r,r2] : [r2,r];
      for (let i=a;i<=b;i++) word += board.grid[i][c];
    }
    const hit = board.placements.find(p => p.word === word);
    if (hit && !found.some(f=>f.word===hit.word)){
      setFound([...found, hit]);
      setPanelText(hit.raw.definicion);
    }
    setDrag(null);
  };

  const done = found.length >= words.length;
  const finish = () => {
    if (currentUser) addScore(currentUser.username, 'Sopa', '—', done ? 100 : found.length*5);
    onBack();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm">Tamaño</label>
          <input type="number" min={6} max={20} value={size} onChange={(e)=>setSize(parseInt(e.target.value||'12'))} className="ml-2 w-20 p-1 border rounded" />
          <label className="text-sm ml-3">Palabras</label>
          <input type="number" min={3} max={20} value={selectionCount} onChange={(e)=>setSelectionCount(parseInt(e.target.value||'8'))} className="ml-2 w-24 p-1 border rounded" />
          <button className="ml-2 px-3 py-1.5 rounded bg-slate-900 text-white" onClick={build}>Generar</button>
        </div>
        <div className="ml-auto">Encontradas: {found.length}/{words.length}</div>
        <ScoreBadge game="Sopa" />
        <button className="px-3 py-1.5 rounded bg-slate-100" onClick={finish}>Volver</button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {board && (
            <div className="inline-grid select-none" style={{ gridTemplateColumns: `repeat(${board.N}, 2rem)` }}>
              {range(board.N).map(r => range(board.N).map(c => {
                const isFound = board && board.placements.some(p=>{
                  if (!found.some(f=>f.word===p.word)) return false;
                  if (p.dir==='H' && p.r===r && c>=p.c && c<p.c+p.word.length) return true;
                  if (p.dir==='V' && p.c===c && r>=p.r && r<p.r+p.word.length) return true;
                  return false;
                });
                return (
                  <div key={`${r}-${c}`} onMouseDown={()=>onMouseDown(r,c)} onMouseUp={()=>onMouseUp(r,c)} className={`w-8 h-8 border flex items-center justify-center font-semibold ${isFound?'bg-emerald-100':'bg-white'}`}>{board.grid[r][c]}</div>
                );
              }))}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-white rounded-2xl border">
            <div className="font-semibold mb-2">Palabras</div>
            <ul className="text-sm space-y-1">
              {words.map(w => (
                <li key={w.concepto} className={found.some(f=>f.raw.concepto===w.concepto)?'line-through text-slate-400':''}>{w.concepto}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl border min-h-24">
            <div className="text-xs text-amber-800 mb-1">Definición</div>
            <div className="text-sm">{panelText || 'Selecciona una palabra completa (horizontal o vertical) para ver su definición.'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== JUEGO: VERDADERO/FALSO =====================
function TrueFalseGame({ setup, onBack, currentUser }){
  const [count, setCount] = useState(10);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const seq = useMemo(()=>{
    const base = shuffle(setup.data).slice(0, Math.max(4, Math.min(40, count)));
    return base.map(item => {
      const isTrue = Math.random()<0.5;
      const def = isTrue ? item.definicion : shuffle(setup.data.filter(x=>x.concepto!==item.concepto))[0]?.definicion || item.definicion;
      return { concepto: item.concepto, definicion: def, isTrue };
    });
  }, [setup, count, started]);

  const start = () => { setStarted(true); setIdx(0); setScore(0); };

  const answer = (v) => {
    if (seq[idx].isTrue === v) setScore(s=>s+5);
    if (idx < seq.length-1) setIdx(i=>i+1); else finish();
  };

  const finish = () => { if (currentUser) addScore(currentUser.username, 'VF', '—', score); onBack(); };

  if (!started) return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm">Afirmaciones</label>
          <input type="number" min={4} max={40} value={count} onChange={(e)=>setCount(parseInt(e.target.value||'10'))} className="ml-2 w-24 p-1 border rounded" />
        </div>
        <ScoreBadge game="VF" />
        <button className="ml-auto px-3 py-1.5 rounded bg-slate-100" onClick={onBack}>Volver</button>
      </div>
      <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white" onClick={start}>Comenzar</button>
    </div>
  );

  const q = seq[idx];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="font-semibold">Puntaje: {score}</div>
        <div className="ml-auto text-sm">{idx+1}/{seq.length}</div>
      </div>
      <div className="p-4 bg-white rounded-2xl border">
        <div className="text-slate-600 text-sm mb-1">"{q.concepto}" corresponde a:</div>
        <div className="font-medium">{q.definicion}</div>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={()=>answer(true)}>Verdadero</button>
        <button className="px-4 py-2 rounded-lg bg-rose-600 text-white" onClick={()=>answer(false)}>Falso</button>
      </div>
    </div>
  );
}

// ===================== JUEGO: MEMORIA =====================
function MemoryGame({ setup, onBack, currentUser }){
  const [pairsCount, setPairsCount] = useState(8); // tarjetas = 2*pairsCount
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState([]);
  const [open, setOpen] = useState([]); // indices abiertos
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);

  const start = () => {
    const pairs = shuffle(setup.data).slice(0, Math.max(2, Math.min(15, pairsCount)));
    const deck = shuffle([
      ...pairs.map((p,i)=>({ id:`C${i}`, kind:'C', pair:i, text:p.concepto })),
      ...pairs.map((p,i)=>({ id:`D${i}`, kind:'D', pair:i, text:p.definicion })),
    ]);
    setCards(deck); setStarted(true); setOpen([]); setMatched(new Set()); setMoves(0);
  };

  useEffect(()=>{
    if (open.length===2){
      const [a,b] = open;
      const match = cards[a]?.pair === cards[b]?.pair && cards[a]?.kind !== cards[b]?.kind;
      setTimeout(()=>{
        setOpen([]);
        if (match){ setMatched(s=> new Set([...Array.from(s), cards[a].pair])); }
      }, 600);
      setMoves(m=>m+1);
    }
  }, [open]);

  const done = matched.size && matched.size*2 === cards.length;
  const finish = () => { if (currentUser) addScore(currentUser.username, 'Memorice', '—', Math.max(10, (matched.size*10 - moves))); onBack(); };

  if (!started) return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm">Nº de pares</label>
          <input type="number" min={2} max={15} value={pairsCount} onChange={(e)=>setPairsCount(parseInt(e.target.value||'8'))} className="ml-2 w-24 p-1 border rounded" />
        </div>
        <ScoreBadge game="Memorice" />
        <button className="ml-auto px-3 py-1.5 rounded bg-slate-100" onClick={onBack}>Volver</button>
      </div>
      <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white" onClick={start}>Comenzar</button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div>Movimientos: {moves}</div>
        <div className="ml-auto">Aciertos: {matched.size}</div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, minmax(0, 1fr))` }}>
        {cards.map((card, i) => {
          const isOpen = open.includes(i) || matched.has(card.pair);
          return (
            <button key={card.id} onClick={()=>{
              if (isOpen || open.length===2) return;
              setOpen(o=>[...o, i]);
            }} className={`p-3 rounded-xl border h-24 flex items-center justify-center ${isOpen?'bg-white':'bg-slate-900 text-white'}`}>
              <span className="text-sm line-clamp-4">{isOpen?card.text:'?'}</span>
            </button>
          );
        })}
      </div>
      {done && <div className="p-2 bg-emerald-100 text-emerald-900 rounded">¡Completado!</div>}
      <div className="flex gap-3"><button className="px-3 py-1.5 rounded bg-slate-100" onClick={finish}>Volver</button></div>
    </div>
  );
}
