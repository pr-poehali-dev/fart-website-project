import { useState, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

// Генерация звука пука через Web Audio API
function playFartSound(variant: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  const duration = 0.4 + (variant % 4) * 0.15;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const distortion = ctx.createWaveShaper();

  // Кривая дисторшна для "грязного" звука
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = (Math.PI + 300) * x / (Math.PI + 300 * Math.abs(x));
  }
  distortion.curve = curve;

  oscillator.connect(distortion);
  distortion.connect(gainNode);
  gainNode.connect(ctx.destination);

  const baseFreqs = [120, 80, 100, 60, 90, 70, 110, 85];
  const baseFreq = baseFreqs[variant % baseFreqs.length];

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(baseFreq + 40, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, ctx.currentTime + duration);

  // Небольшая вибрация
  oscillator.frequency.setValueAtTime(baseFreq + 40, ctx.currentTime);
  for (let i = 0; i < 8; i++) {
    const t = ctx.currentTime + (i * duration) / 8;
    const wobble = baseFreq + 40 - (i / 8) * (baseFreq * 0.7) + Math.sin(i * 3) * 15;
    oscillator.frequency.setValueAtTime(wobble, t);
  }

  gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);

  setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
}

interface FartCloud {
  id: number;
  x: number;
  y: number;
}

type Page = 'home' | 'gallery' | 'rating' | 'about';

interface Sound {
  id: number;
  title: string;
  author: string;
  category: string;
  emoji: string;
  votes: number;
  plays: number;
  duration: string;
  tags: string[];
  color: 'purple' | 'yellow' | 'pink' | 'cyan';
}

const SOUNDS: Sound[] = [
  { id: 1, title: 'Thunderstrike Bass', author: 'DJ Молния', category: 'Басс', emoji: '⚡', votes: 2847, plays: 18400, duration: '0:08', tags: ['агрессивный', 'баc', 'электро'], color: 'purple' },
  { id: 2, title: 'Neon Whisper', author: 'Кибер Лиса', category: 'Атмосфера', emoji: '🌙', votes: 2341, plays: 15200, duration: '0:12', tags: ['мягкий', 'атмосфера'], color: 'cyan' },
  { id: 3, title: 'Acid Drop', author: 'Кислотный Кот', category: 'Эффект', emoji: '💧', votes: 1998, plays: 12100, duration: '0:05', tags: ['кислотный', 'капля'], color: 'yellow' },
  { id: 4, title: 'Galaxy Ping', author: 'Звёздный Путь', category: 'Сигнал', emoji: '🔔', votes: 1754, plays: 9800, duration: '0:03', tags: ['космос', 'нотификация'], color: 'pink' },
  { id: 5, title: 'Glitch Storm', author: 'Цифровой Дух', category: 'Глитч', emoji: '📡', votes: 1502, plays: 8700, duration: '0:07', tags: ['глитч', 'цифровой'], color: 'purple' },
  { id: 6, title: 'Forest Rain', author: 'Природа Pro', category: 'Природа', emoji: '🌿', votes: 1283, plays: 7300, duration: '0:15', tags: ['природа', 'дождь'], color: 'cyan' },
  { id: 7, title: 'Retro Boom', author: '8-Bit Hero', category: '8-Бит', emoji: '👾', votes: 1100, plays: 6200, duration: '0:04', tags: ['ретро', 'пиксели'], color: 'yellow' },
  { id: 8, title: 'Deep Space', author: 'Астронавт', category: 'Космос', emoji: '🚀', votes: 943, plays: 5100, duration: '0:10', tags: ['космос', 'глубина'], color: 'pink' },
];

const COLOR_MAP = {
  purple: { glow: 'rgba(168,85,247,0.2)', hex: '#a855f7', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  yellow: { glow: 'rgba(212,255,0,0.15)', hex: '#d4ff00', badge: 'bg-yellow-400/20 text-yellow-300 border-yellow-500/30' },
  pink: { glow: 'rgba(247,37,133,0.2)', hex: '#f72585', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  cyan: { glow: 'rgba(0,245,255,0.15)', hex: '#00f5ff', badge: 'bg-cyan-400/20 text-cyan-300 border-cyan-500/30' },
};

const NavBar = ({ page, setPage }: { page: Page; setPage: (p: Page) => void }) => {
  const [open, setOpen] = useState(false);
  const links: { id: Page; label: string; icon: string }[] = [
    { id: 'home', label: 'Главная', icon: 'Zap' },
    { id: 'gallery', label: 'Галерея', icon: 'LayoutGrid' },
    { id: 'rating', label: 'Рейтинг', icon: 'Trophy' },
    { id: 'about', label: 'О проекте', icon: 'Info' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => setPage('home')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center pulse-glow">
            <span className="text-sm">🎵</span>
          </div>
          <span className="font-oswald text-lg font-bold tracking-wider gradient-text">SOUNDRANK</span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => setPage(l.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                page === l.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon name={l.icon} size={14} />
              {l.label}
            </button>
          ))}
        </div>

        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
          <Icon name={open ? 'X' : 'Menu'} size={22} />
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-white/5 px-4 py-3 flex flex-col gap-1">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => { setPage(l.id); setOpen(false); }}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                page === l.id ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon name={l.icon} size={16} />
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

const SoundCard = ({
  sound, rank, voted, onVote, onPlay, playing,
}: {
  sound: Sound; rank?: number; voted: boolean;
  onVote: (id: number, e: React.MouseEvent) => void; onPlay: (id: number) => void; playing: boolean;
}) => {
  const c = COLOR_MAP[sound.color];

  return (
    <div className="glass glass-hover rounded-2xl p-5 border border-white/5 animate-fade-in relative overflow-hidden"
      style={{ animationDelay: `${(sound.id % 8) * 0.07}s` }}>
      {rank && rank <= 3 && (
        <div
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-oswald"
          style={{ background: rank === 1 ? '#d4ff00' : rank === 2 ? '#c0c0c0' : '#cd7f32', color: '#0a0a0f' }}
        >{rank}</div>
      )}

      <div className="flex items-start gap-4">
        <button
          onClick={() => onPlay(sound.id)}
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: c.glow, border: `1px solid ${c.hex}40`, boxShadow: playing ? `0 0 20px ${c.glow}` : 'none' }}
        >
          {playing ? (
            <div className="flex items-end gap-0.5">
              {[12, 20, 28, 20, 12].map((h, i) => (
                <span key={i} className="w-0.5 rounded-sm" style={{
                  height: h, background: c.hex,
                  animation: `wave 1s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                  display: 'block',
                }} />
              ))}
            </div>
          ) : (
            <span className="text-2xl">{sound.emoji}</span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${c.badge}`}>{sound.category}</span>
            <span className="text-xs text-gray-600">{sound.duration}</span>
          </div>
          <h3 className="font-oswald text-base font-semibold text-white/90 truncate">{sound.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{sound.author}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {sound.tags.map(tag => (
              <span key={tag} className="text-xs text-gray-600 bg-white/5 rounded px-1.5 py-0.5">#{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Icon name="Play" size={12} />
          {sound.plays.toLocaleString('ru')}
        </span>
        <button
          onClick={(e) => onVote(sound.id, e)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all vote-btn relative overflow-visible ${
            voted
              ? 'bg-yellow-400/15 border-yellow-500/40 text-yellow-300'
              : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/40 hover:text-purple-300'
          }`}
        >
          <Icon name="Heart" size={14} />
          <span>{(voted ? sound.votes + 1 : sound.votes).toLocaleString('ru')}</span>
        </button>
      </div>
    </div>
  );
};

const HomePage = ({ sounds, votes, onVote, playing, onPlay, setPage }: {
  sounds: Sound[]; votes: Set<number>; onVote: (id: number, e: React.MouseEvent) => void;
  playing: number | null; onPlay: (id: number) => void; setPage: (p: Page) => void;
}) => {
  const top3 = [...sounds].sort((a, b) => b.votes - a.votes).slice(0, 3);

  return (
    <div className="min-h-screen pt-16 bg-grid relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="absolute bottom-40 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d4ff00, transparent)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 glass border border-purple-500/20 rounded-full px-4 py-2 text-xs text-purple-300 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" style={{ boxShadow: '0 0 6px rgba(168,85,247,0.8)' }} />
          LIVE · {sounds.reduce((s, x) => s + x.votes, 0).toLocaleString('ru')} голосов
        </div>

        <h1 className="font-oswald text-6xl md:text-8xl font-black mb-4 animate-fade-in stagger-1 leading-none">
          <span className="gradient-text">SOUND</span>
          <br />
          <span className="text-white/90">RANK</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-md mx-auto mb-10 animate-fade-in stagger-2">
          Слушай, голосуй, побеждай. Рейтинг лучших звуков и эффектов в одном месте.
        </p>

        <div className="flex gap-3 justify-center flex-wrap animate-fade-in stagger-3">
          <button
            onClick={() => setPage('gallery')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-purple-500 hover:bg-purple-400 text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] active:scale-95"
          >
            <Icon name="LayoutGrid" size={16} />
            Галерея звуков
          </button>
          <button
            onClick={() => setPage('rating')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm glass border border-white/10 text-gray-300 hover:border-yellow-500/40 hover:text-yellow-300 transition-all hover:scale-105"
          >
            <Icon name="Trophy" size={16} />
            Топ рейтинг
          </button>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Flame" size={20} className="text-orange-400" />
          <h2 className="font-oswald text-2xl font-bold text-white/90">ТОП-3 ПРЯМО СЕЙЧАС</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {top3.map((s, i) => (
            <SoundCard key={s.id} sound={s} rank={i + 1} voted={votes.has(s.id)} onVote={onVote} onPlay={onPlay} playing={playing === s.id} />
          ))}
        </div>
      </div>
    </div>
  );
};

const GalleryPage = ({ sounds, votes, onVote, playing, onPlay }: {
  sounds: Sound[]; votes: Set<number>; onVote: (id: number, e: React.MouseEvent) => void;
  playing: number | null; onPlay: (id: number) => void;
}) => {
  const [filter, setFilter] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(sounds.map(s => s.category)))];
  const filtered = filter === 'all' ? sounds : sounds.filter(s => s.category === filter);

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-oswald text-4xl font-black text-white/90 mb-2">ГАЛЕРЕЯ</h1>
          <p className="text-gray-500 text-sm">{sounds.length} звуков и эффектов</p>
        </div>
        <div className="flex gap-2 flex-wrap mb-8 animate-fade-in stagger-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                filter === cat
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'glass border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
              }`}
            >
              {cat === 'all' ? 'Все' : cat}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(s => (
            <SoundCard key={s.id} sound={s} voted={votes.has(s.id)} onVote={onVote} onPlay={onPlay} playing={playing === s.id} />
          ))}
        </div>
      </div>
    </div>
  );
};

const RatingPage = ({ sounds, votes, onVote, playing, onPlay }: {
  sounds: Sound[]; votes: Set<number>; onVote: (id: number, e: React.MouseEvent) => void;
  playing: number | null; onPlay: (id: number) => void;
}) => {
  const sorted = [...sounds].sort((a, b) => {
    const va = a.votes + (votes.has(a.id) ? 1 : 0);
    const vb = b.votes + (votes.has(b.id) ? 1 : 0);
    return vb - va;
  });
  const maxVotes = sorted[0] ? sorted[0].votes + 1 : 1;
  const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-oswald text-4xl font-black text-white/90 mb-2">РЕЙТИНГ</h1>
          <p className="text-gray-500 text-sm">Живые голоса · обновляется в реальном времени</p>
        </div>

        <div className="flex flex-col gap-3">
          {sorted.map((s, i) => {
            const v = s.votes + (votes.has(s.id) ? 1 : 0);
            const pct = Math.round((v / maxVotes) * 100);
            const c = COLOR_MAP[s.color];

            return (
              <div key={s.id} className="glass glass-hover rounded-2xl p-4 border border-white/5 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center font-oswald text-lg font-bold text-gray-500">
                    {medals[i] !== undefined ? medals[i] : `${i + 1}`}
                  </div>
                  <button
                    onClick={() => onPlay(s.id)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-all hover:scale-110"
                    style={{ background: c.glow, border: `1px solid ${c.hex}40` }}
                  >
                    {playing === s.id ? '▶' : s.emoji}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white/90 text-sm truncate">{s.title}</span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{v.toLocaleString('ru')} гол.</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c.hex}, ${c.hex}88)`, boxShadow: `0 0 6px ${c.hex}55` }} />
                    </div>
                  </div>
                  <button
                    onClick={(e) => onVote(s.id, e)}
                    className={`vote-btn flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                      votes.has(s.id)
                        ? 'bg-yellow-400/15 border-yellow-500/40 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-purple-500/40 hover:text-purple-300'
                    }`}
                  >
                    <Icon name="Heart" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 glass rounded-2xl p-6 border border-white/5 animate-fade-in">
          <h3 className="font-oswald text-lg font-bold text-white/80 mb-4">СТАТИСТИКА</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-oswald text-3xl font-black neon-purple">{sounds.length}</div>
              <div className="text-xs text-gray-500 mt-1">Звуков</div>
            </div>
            <div>
              <div className="font-oswald text-3xl font-black neon-yellow">
                {(sounds.reduce((s, x) => s + x.votes, 0) + votes.size).toLocaleString('ru')}
              </div>
              <div className="text-xs text-gray-500 mt-1">Голосов</div>
            </div>
            <div>
              <div className="font-oswald text-3xl font-black" style={{ color: '#00f5ff', textShadow: '0 0 15px rgba(0,245,255,0.5)' }}>
                {sounds.reduce((s, x) => s + x.plays, 0).toLocaleString('ru')}
              </div>
              <div className="text-xs text-gray-500 mt-1">Прослушиваний</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AboutPage = ({ setPage }: { setPage: (p: Page) => void }) => {
  const features = [
    { icon: 'Volume2', title: 'Слушай звуки', desc: 'Нажми на карточку чтобы воспроизвести звук прямо в браузере', color: 'purple' as const },
    { icon: 'Heart', title: 'Голосуй', desc: 'Ставь лайки любимым звукам — один лайк в сутки за каждый', color: 'yellow' as const },
    { icon: 'Trophy', title: 'Следи за рейтингом', desc: 'Живой рейтинг обновляется сразу после голосования', color: 'pink' as const },
    { icon: 'LayoutGrid', title: 'Исследуй галерею', desc: 'Фильтруй по категориям: басс, атмосфера, эффекты и другие', color: 'cyan' as const },
  ];

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-14 animate-fade-in">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="font-oswald text-5xl font-black mb-3">
            <span className="gradient-text">О ПРОЕКТЕ</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
            SoundRank — платформа для любителей звуков и аудиоэффектов. Голосуй за лучшие, открывай новые и делись с другими.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {features.map((f, i) => {
            const c = COLOR_MAP[f.color];
            return (
              <div key={f.title} className="glass glass-hover rounded-2xl p-6 border border-white/5 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: c.glow, border: `1px solid ${c.hex}40` }}>
                  <Icon name={f.icon} size={22} style={{ color: c.hex }} />
                </div>
                <h3 className="font-oswald text-lg font-bold text-white/90 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="glass rounded-2xl p-8 border border-purple-500/20 text-center animate-fade-in">
          <h3 className="font-oswald text-2xl font-bold text-white/90 mb-3">ГОТОВ НАЧАТЬ?</h3>
          <p className="text-gray-500 text-sm mb-6">Переходи в галерею, слушай и голосуй за лучшие звуки</p>
          <button
            onClick={() => setPage('gallery')}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-purple-500 hover:bg-purple-400 text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          >
            <Icon name="LayoutGrid" size={16} />
            Открыть галерею
          </button>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [page, setPage] = useState<Page>('home');
  const [votes, setVotes] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState<number | null>(null);
  const [clouds, setClouds] = useState<FartCloud[]>([]);
  const cloudCounter = useRef(0);

  const spawnCloud = useCallback((e: React.MouseEvent) => {
    const id = ++cloudCounter.current;
    const x = e.clientX;
    const y = e.clientY;
    setClouds(prev => [...prev, { id, x, y }]);
    setTimeout(() => setClouds(prev => prev.filter(c => c.id !== id)), 1000);
  }, []);

  const handleVote = useCallback((id: number, e?: React.MouseEvent) => {
    setVotes(prev => {
      const next = new Set(prev);
      const adding = !next.has(id);
      if (adding) {
        next.add(id);
        playFartSound(id);
        if (e) spawnCloud(e);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, [spawnCloud]);

  const handlePlay = (id: number) => {
    playFartSound(id);
    setPlaying(prev => prev === id ? null : id);
  };

  const commonProps = { sounds: SOUNDS, votes, onVote: handleVote, playing, onPlay: handlePlay };

  return (
    <div className="relative">
      <NavBar page={page} setPage={setPage} />
      {page === 'home' && <HomePage {...commonProps} setPage={setPage} />}
      {page === 'gallery' && <GalleryPage {...commonProps} />}
      {page === 'rating' && <RatingPage {...commonProps} />}
      {page === 'about' && <AboutPage setPage={setPage} />}

      {/* Облачки пуков */}
      {clouds.map(c => (
        <div
          key={c.id}
          className="fixed pointer-events-none z-[999] select-none"
          style={{
            left: c.x,
            top: c.y,
            transform: 'translate(-50%, -50%)',
            animation: 'fart-cloud 1s ease-out forwards',
            fontSize: '2.5rem',
          }}
        >
          💨
        </div>
      ))}
    </div>
  );
};

export default Index;