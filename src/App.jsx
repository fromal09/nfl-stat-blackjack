import { useState, useEffect, useRef, useCallback } from "react";
import { PLAYER_DATA } from "./data/players";

const STAT_CATEGORIES = [
  { id: "pass_td",    label: "Passing TDs",    target: 500,   unit: "TDs",   description: "Career passing touchdowns" },
  { id: "pass_yds",  label: "Passing Yards",   target: 75000, unit: "Yds",   description: "Career passing yards" },
  { id: "rush_td",   label: "Rushing TDs",     target: 175,   unit: "TDs",   description: "Career rushing touchdowns" },
  { id: "rush_yds",  label: "Rushing Yards",   target: 15000, unit: "Yds",   description: "Career rushing yards" },
  { id: "rec_td",    label: "Receiving TDs",   target: 175,   unit: "TDs",   description: "Career receiving touchdowns" },
  { id: "rec_yds",   label: "Receiving Yards", target: 18000, unit: "Yds",   description: "Career receiving yards" },
  { id: "receptions",label: "Receptions",      target: 1500,  unit: "Rec",   description: "Career receptions" },
  { id: "sacks",     label: "Sacks",           target: 200,   unit: "Sacks", description: "Career sacks" },
];

const fmt = (n) =>
  typeof n === "number" ? (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1)) : String(n);

function dealHandForPlayer(pool, target, globalUsed) {
  const cap = target * 0.75;
  const eligible = pool.filter((p) => p.value < cap && !globalUsed.has(p.name));
  if (eligible.length < 2) return [];
  for (let i = 0; i < 200; i++) {
    const a = Math.floor(Math.random() * eligible.length);
    let b = Math.floor(Math.random() * eligible.length);
    while (b === a) b = Math.floor(Math.random() * eligible.length);
    const sum = eligible[a].value + eligible[b].value;
    if (sum <= cap && sum > 0) return [eligible[a], eligible[b]];
  }
  const sorted = [...eligible].sort((a, b) => a.value - b.value);
  return [sorted[0], sorted[1]];
}

function fuzzySearch(query, pool, usedPool) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const avail = pool.filter((p) => !usedPool.has(p.name));
  const sw = avail.filter((p) => p.name.toLowerCase().startsWith(q));
  const co = avail.filter((p) => !p.name.toLowerCase().startsWith(q) && p.name.toLowerCase().includes(q));
  return [...sw, ...co].slice(0, 6);
}

// ── SVG Football Player (results screen only) ─────────────────────────────────
function FootballPlayer({ won = false }) {
  return (
    <svg viewBox="0 0 140 220" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="70" cy="215" rx="38" ry="7" fill="rgba(0,0,0,.35)" />
      <rect x="42" y="148" width="22" height="50" rx="10" fill="#0d2e14" />
      <rect x="76" y="148" width="22" height="50" rx="10" fill="#0d2e14" />
      <ellipse cx="53" cy="198" rx="14" ry="8" fill="#060f08" />
      <ellipse cx="87" cy="198" rx="14" ry="8" fill="#060f08" />
      <rect x="40" y="193" width="26" height="7" rx="3" fill="#060f08" />
      <rect x="74" y="193" width="26" height="7" rx="3" fill="#060f08" />
      <rect x="44" y="148" width="4" height="48" rx="2" fill="#d4af37" opacity="0.5" />
      <rect x="78" y="148" width="4" height="48" rx="2" fill="#d4af37" opacity="0.5" />
      <rect x="32" y="88" width="76" height="64" rx="10" fill="#1a5c2a" />
      <text x="70" y="128" textAnchor="middle" fontFamily="serif" fontSize="28" fontWeight="900" fill="#d4af37" opacity="0.35">00</text>
      <rect x="32" y="92" width="76" height="6" rx="3" fill="#d4af37" opacity="0.25" />
      <rect x="18" y="84" width="104" height="22" rx="11" fill="#236b30" />
      <rect x="18" y="84" width="104" height="5" rx="3" fill="#2a8038" opacity="0.6" />
      <rect x="57" y="70" width="26" height="20" rx="6" fill="#c8a882" />
      <ellipse cx="70" cy="52" rx="30" ry="32" fill="#1a5c2a" />
      <ellipse cx="60" cy="38" rx="12" ry="8" fill="#2a8038" opacity="0.5" />
      <rect x="67" y="22" width="7" height="36" rx="3.5" fill="#d4af37" />
      <circle cx="40" cy="56" r="5" fill="#0d2e14" />
      <circle cx="100" cy="56" r="5" fill="#0d2e14" />
      <path d="M42,70 Q70,82 98,70" stroke="#0d2e14" strokeWidth="3" fill="none" />
      <rect x="44" y="60" width="12" height="3.5" rx="1.75" fill="#d4af37" />
      <rect x="44" y="68" width="12" height="3.5" rx="1.75" fill="#d4af37" />
      <rect x="84" y="60" width="12" height="3.5" rx="1.75" fill="#d4af37" />
      <rect x="84" y="68" width="12" height="3.5" rx="1.75" fill="#d4af37" />
      <rect x="44" y="58" width="3.5" height="16" rx="1.75" fill="#d4af37" />
      <rect x="92.5" y="58" width="3.5" height="16" rx="1.75" fill="#d4af37" />
      <path d="M44,56 Q70,72 96,56 Q96,80 70,80 Q44,80 44,56Z" fill="#0a1a0d" opacity="0.75" />
      {/* Arms — both raised if won, normal if not */}
      <g transform={won ? "rotate(-70,32,88)" : "rotate(20,32,88)"} style={{ transition: "transform 0.4s ease" }}>
        <rect x="18" y="88" width="16" height="44" rx="8" fill="#1a5c2a" />
        <ellipse cx="26" cy="134" rx="10" ry="10" fill="#c8a882" />
      </g>
      <g transform={won ? "rotate(70,108,88)" : "rotate(-20,108,88)"} style={{ transition: "transform 0.4s ease" }}>
        <rect x="100" y="88" width="16" height="46" rx="8" fill="#1a5c2a" />
        <ellipse cx="108" cy="136" rx="10" ry="10" fill="#c8a882" />
      </g>
    </svg>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Barlow+Condensed:wght@400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

html,body,#root{min-height:100vh;background:#050e08}

.bj{
  min-height:100vh;
  width:100%;
  max-width:1100px;
  margin:0 auto;
  background:radial-gradient(ellipse at 50% 0%,#1b3d22 0%,#091510 70%);
  font-family:'Barlow Condensed',sans-serif;
  color:#e8dfc0;
  padding-bottom:64px;
  position:relative;
  overflow-x:hidden;
  box-shadow:0 0 120px rgba(0,0,0,.9);
}
.felt{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.011) 2px,rgba(255,255,255,.011) 4px)}

.bj-hdr{position:relative;z-index:1;text-align:center;padding:28px 20px 18px;border-bottom:1px solid rgba(212,175,55,.18)}
.bj-logo{font-family:'Playfair Display',serif;font-size:clamp(24px,5vw,46px);font-weight:900;color:#d4af37;letter-spacing:2px;text-shadow:0 0 40px rgba(212,175,55,.35);line-height:1}
.bj-logo em{color:#e8dfc0;font-style:normal}
.bj-sub{font-size:12px;letter-spacing:4px;text-transform:uppercase;color:rgba(232,223,192,.42);margin-top:5px}
.bj-brand{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#d4af37;opacity:.55;margin-top:3px}

.setup{position:relative;z-index:1;max-width:620px;margin:32px auto;padding:0 20px}
.setup-sec{margin-bottom:28px}
.setup-lbl{font-family:'Playfair Display',serif;font-size:18px;color:#d4af37;margin-bottom:12px;display:flex;align-items:center;gap:10px}
.setup-lbl::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(212,175,55,.35),transparent)}
.count-row{display:flex;gap:10px}
.cnt-btn{width:54px;height:54px;border-radius:50%;border:2px solid rgba(212,175,55,.28);background:rgba(212,175,55,.04);color:#e8dfc0;font-family:'Playfair Display',serif;font-size:20px;cursor:pointer;transition:all .2s}
.cnt-btn:hover{border-color:#d4af37;background:rgba(212,175,55,.14)}
.cnt-btn.on{border-color:#d4af37;background:rgba(212,175,55,.22);color:#d4af37;box-shadow:0 0 16px rgba(212,175,55,.28)}
.names-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.name-inp{background:rgba(255,255,255,.04);border:1px solid rgba(212,175,55,.22);border-radius:6px;padding:10px 14px;color:#e8dfc0;font-family:'Barlow Condensed',sans-serif;font-size:15px;letter-spacing:1px;outline:none;transition:border-color .2s;width:100%}
.name-inp:focus{border-color:#d4af37}
.name-inp::placeholder{color:rgba(232,223,192,.28)}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
.cat-btn{padding:11px 10px;border-radius:7px;border:1px solid rgba(212,175,55,.18);background:rgba(212,175,55,.03);color:#e8dfc0;cursor:pointer;transition:all .2s;text-align:left;width:100%}
.cat-btn:hover{border-color:rgba(212,175,55,.5);background:rgba(212,175,55,.08)}
.cat-btn.on{border-color:#d4af37;background:rgba(212,175,55,.15);box-shadow:0 0 12px rgba(212,175,55,.17)}
.cat-nm{font-size:13px;font-weight:700;letter-spacing:.4px}
.cat-tgt{font-size:11px;color:#d4af37;margin-top:3px;letter-spacing:1px}
.deal-in{width:100%;padding:16px;border-radius:8px;border:2px solid #d4af37;background:linear-gradient(135deg,#d4af37,#b8922a);color:#091510;font-family:'Playfair Display',serif;font-size:20px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;text-transform:uppercase}
.deal-in:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(212,175,55,.38)}
.deal-in:disabled{opacity:.38;cursor:not-allowed}

.play{position:relative;z-index:1;max-width:960px;margin:0 auto;padding:20px 12px}
.tgt-banner{text-align:center;margin-bottom:18px}
.tgt-cat{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(232,223,192,.45)}
.tgt-num{font-family:'Playfair Display',serif;font-size:clamp(36px,7vw,64px);font-weight:900;color:#d4af37;line-height:1;text-shadow:0 0 36px rgba(212,175,55,.45)}
.tgt-lbl{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(232,223,192,.38)}

.players-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px}
.panel{border-radius:11px;border:1px solid rgba(212,175,55,.12);background:rgba(0,0,0,.28);padding:14px;transition:border-color .3s,box-shadow .3s,opacity .3s;position:relative;overflow:hidden}
.panel.active-turn{border-color:#d4af37;box-shadow:0 0 26px rgba(212,175,55,.17),inset 0 0 30px rgba(212,175,55,.04)}
.panel.bust{border-color:rgba(220,50,50,.33);opacity:.65}
.panel.stood{border-color:rgba(100,200,100,.26);opacity:.82}
.panel.blackjack{border-color:#d4af37;box-shadow:0 0 40px rgba(212,175,55,.6)}
.turn-dot{position:absolute;top:10px;right:10px;width:7px;height:7px;background:#d4af37;border-radius:50%;box-shadow:0 0 7px #d4af37;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.6)}}
.p-name{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#e8dfc0;margin-bottom:3px}
.p-status{font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
.s-active{color:#d4af37}.s-stood{color:#6fc876}.s-bust{color:#e05555}.s-blackjack{color:#d4af37;font-weight:700}
.p-total{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;line-height:1;margin-bottom:9px}
.t-ok{color:#e8dfc0}.t-close{color:#d4af37}.t-bust{color:#e05555}.t-bj{color:#d4af37;text-shadow:0 0 16px rgba(212,175,55,.7)}
.prog-bg{height:3px;background:rgba(255,255,255,.07);border-radius:2px;margin-bottom:9px;overflow:hidden}
.prog-fill{height:100%;border-radius:2px;transition:width .5s ease}
.cards-list{display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto}
.card-row{display:flex;justify-content:space-between;align-items:center;border-radius:4px;padding:5px 8px;font-size:12px}
.card-row.dealt{background:rgba(255,255,255,.04)}
.card-row.starting{background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2)}
.c-name{color:#e8dfc0;font-size:12px}.c-val{color:#d4af37;font-weight:700;letter-spacing:.8px;font-size:12px}
.c-badge{font-size:8px;letter-spacing:1px;color:rgba(212,175,55,.45);margin-left:4px;text-transform:uppercase}
@keyframes compressIn{0%{max-height:0;opacity:0;transform:scaleY(0.4)}100%{max-height:60px;opacity:1;transform:scaleY(1)}}
.card-row.compress-in{animation:compressIn .35s ease forwards;transform-origin:top}
@keyframes dealIn{
  0%{opacity:0;transform:translateX(-18px) scaleX(0.85)}
  60%{opacity:1;transform:translateX(3px) scaleX(1.02)}
  100%{opacity:1;transform:translateX(0) scaleX(1)}
}
.card-row.deal-in{animation:dealIn .32s cubic-bezier(.22,1,.36,1) forwards}
.card-placeholder{height:28px;border-radius:4px;background:rgba(212,175,55,.04);border:1px dashed rgba(212,175,55,.1)}

.inp-area{max-width:520px;margin:0 auto;position:relative}
.turn-ind{text-align:center;margin-bottom:12px}
.turn-nm{font-family:'Playfair Display',serif;font-size:19px;color:#d4af37}
.turn-sb{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(232,223,192,.38);margin-top:2px}
.inp-wrap{position:relative;margin-bottom:8px}
.inp-row{display:flex;gap:8px}
.pl-input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(212,175,55,.28);border-radius:8px;padding:12px 14px;color:#e8dfc0;font-family:'Barlow Condensed',sans-serif;font-size:16px;letter-spacing:1px;outline:none;transition:border-color .2s,box-shadow .2s;min-width:0}
.pl-input:focus{border-color:#d4af37;box-shadow:0 0 16px rgba(212,175,55,.12)}
.pl-input:disabled{opacity:.4;cursor:not-allowed}
.pl-input::placeholder{color:rgba(232,223,192,.22)}
.deal-btn{padding:12px 20px;border-radius:8px;border:1px solid #d4af37;background:rgba(212,175,55,.13);color:#d4af37;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0}
.deal-btn:hover{background:rgba(212,175,55,.26)}
.deal-btn:disabled{opacity:.4;cursor:not-allowed}
.suggs{position:absolute;top:calc(100% + 3px);left:0;right:0;background:#0d1d12;border:1px solid rgba(212,175,55,.3);border-radius:7px;overflow:hidden;z-index:300;box-shadow:0 8px 32px rgba(0,0,0,.75)}
.sug-item{display:flex;align-items:center;padding:9px 13px;cursor:pointer;transition:background .12s;font-size:13px;border-bottom:1px solid rgba(255,255,255,.04)}
.sug-item:last-child{border-bottom:none}
.sug-item:hover,.sug-item.hi{background:rgba(212,175,55,.13)}
.sug-nm{color:#e8dfc0;letter-spacing:.3px}
.stand-btn{width:100%;padding:10px;border-radius:7px;border:1px solid rgba(100,200,100,.33);background:rgba(100,200,100,.06);color:#6fc876;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.stand-btn:hover{background:rgba(100,200,100,.15)}
.err{text-align:center;color:#e05555;font-size:12px;letter-spacing:1px;min-height:18px;margin-top:6px}

/* ═══════════════════════════════════════════════
   CINEMATIC CARD OVERLAY
═══════════════════════════════════════════════ */

/* Backdrop — blurs and darkens game */
.card-backdrop{
  position:fixed;inset:0;z-index:490;
  background:rgba(3,9,5,.9);
  animation:bdIn .25s ease forwards;
}
@keyframes bdIn{from{opacity:0}to{opacity:1}}
.card-backdrop.exiting{animation:bdOut .3s ease forwards}
@keyframes bdOut{from{opacity:1}to{opacity:0}}

/* Spotlight beam from above */
.card-spotlight{
  position:fixed;
  top:-20%;left:50%;
  transform:translateX(-50%);
  width:500px;height:80vh;
  background:conic-gradient(from 180deg at 50% 0%,transparent 75deg,rgba(212,175,55,.07) 90deg,rgba(212,175,55,.13) 100deg,rgba(212,175,55,.07) 110deg,transparent 125deg);
  z-index:491;
  pointer-events:none;
  animation:spotIn .4s .1s ease forwards;
  opacity:0;
}
@keyframes spotIn{to{opacity:1}}
.card-spotlight.exiting{animation:spotOut .25s ease forwards}
@keyframes spotOut{to{opacity:0}}

/* Stage — centers the card */
.card-stage{
  position:fixed;inset:0;z-index:492;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  pointer-events:none;
  gap:20px;
}

/* Card container — enters from above */
.card-container{
  pointer-events:auto;
  cursor:pointer;
  animation:cardDrop .4s cubic-bezier(.22,1,.36,1) forwards;
  transform:translateY(-60px);
  opacity:0;
}
@keyframes cardDrop{
  to{transform:translateY(0);opacity:1}
}
.card-container.exiting{
  animation:cardExit .28s cubic-bezier(.4,0,1,1) forwards;
  pointer-events:none;
}
@keyframes cardExit{
  to{transform:translateY(30px) scale(0.92);opacity:0}
}

/* The flip card itself */
.flip-scene{
  width:300px;
  height:200px;
  perspective:1400px;
}
.flip-card{
  width:100%;height:100%;
  position:relative;
  transform-style:preserve-3d;
  transition:transform .7s cubic-bezier(.4,0,.2,1);
  /* subtle idle float */
  animation:cardFloat 3s 0.5s ease-in-out infinite;
}
.flip-card.flipped{
  transform:rotateY(180deg);
  animation:none;
}
@keyframes cardFloat{
  0%,100%{transform:translateY(0) rotateZ(0deg)}
  33%{transform:translateY(-6px) rotateZ(0.4deg)}
  66%{transform:translateY(-3px) rotateZ(-0.3deg)}
}

.flip-face{
  position:absolute;inset:0;
  backface-visibility:hidden;
  border-radius:18px;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:10px;
}

/* Front face (shows player name) */
.flip-front{
  background:linear-gradient(160deg,#1e4428 0%,#0d1f12 55%,#162b10 100%);
  border:1.5px solid rgba(212,175,55,.7);
  box-shadow:
    0 0 0 1px rgba(212,175,55,.12),
    0 8px 32px rgba(0,0,0,.6),
    0 32px 80px rgba(0,0,0,.5),
    inset 0 1px 0 rgba(212,175,55,.2);
}
/* Inner border detail */
.flip-front::before{
  content:'';
  position:absolute;inset:10px;
  border-radius:11px;
  border:1px solid rgba(212,175,55,.14);
  background:repeating-linear-gradient(
    45deg,
    transparent,transparent 8px,
    rgba(212,175,55,.025) 8px,rgba(212,175,55,.025) 9px
  );
  pointer-events:none;
}
/* Corner ornaments */
.flip-front::after{
  content:'◆';
  position:absolute;top:14px;right:14px;
  font-size:10px;color:rgba(212,175,55,.3);
  pointer-events:none;
}

/* Back face (shows stat) */
.flip-back{
  background:linear-gradient(160deg,#1e4428 0%,#0d1f12 55%,#162b10 100%);
  border:1.5px solid #d4af37;
  box-shadow:
    0 0 0 1px rgba(212,175,55,.2),
    0 8px 32px rgba(0,0,0,.6),
    0 32px 80px rgba(0,0,0,.5),
    0 0 60px rgba(212,175,55,.18),
    inset 0 1px 0 rgba(212,175,55,.25);
  transform:rotateY(180deg);
}
.flip-back::after{
  content:'◆';
  position:absolute;top:14px;right:14px;
  font-size:10px;color:rgba(212,175,55,.4);
  pointer-events:none;
}

.flip-eyebrow{
  font-size:9px;letter-spacing:5px;text-transform:uppercase;
  color:rgba(212,175,55,.45);
  position:relative;z-index:1;
}
.flip-player-name{
  font-family:'Playfair Display',serif;
  font-size:22px;font-weight:700;
  color:#e8dfc0;
  text-align:center;
  padding:0 20px;
  line-height:1.2;
  position:relative;z-index:1;
}
.flip-divider{
  width:40px;height:1px;
  background:linear-gradient(to right,transparent,rgba(212,175,55,.4),transparent);
  position:relative;z-index:1;
}
.flip-cta{
  font-size:9px;letter-spacing:4px;text-transform:uppercase;
  color:rgba(212,175,55,.4);
  position:relative;z-index:1;
  animation:ctaPulse 2s 1s ease-in-out infinite;
}
@keyframes ctaPulse{0%,100%{opacity:.4}50%{opacity:.85}}

/* Stat reveal */
.flip-stat-num{
  font-family:'Playfair Display',serif;
  font-size:64px;font-weight:900;
  color:#d4af37;
  line-height:1;
  text-shadow:0 0 40px rgba(212,175,55,.6),0 0 80px rgba(212,175,55,.25);
  position:relative;z-index:1;
  animation:statGlow 2s ease-in-out infinite;
}
@keyframes statGlow{
  0%,100%{text-shadow:0 0 40px rgba(212,175,55,.6),0 0 80px rgba(212,175,55,.25)}
  50%{text-shadow:0 0 60px rgba(212,175,55,.9),0 0 100px rgba(212,175,55,.4)}
}
.flip-stat-unit{
  font-size:11px;letter-spacing:4px;text-transform:uppercase;
  color:rgba(232,223,192,.4);
  position:relative;z-index:1;
}
.flip-stat-name{
  font-family:'Playfair Display',serif;
  font-size:13px;font-weight:700;
  color:rgba(232,223,192,.6);
  position:relative;z-index:1;
  letter-spacing:.5px;
}
.flip-add-cta{
  font-size:9px;letter-spacing:4px;text-transform:uppercase;
  color:rgba(212,175,55,.45);
  position:relative;z-index:1;
  margin-top:4px;
  animation:ctaPulse 2s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════
   RESULTS SCREEN
═══════════════════════════════════════════════ */
.results{position:relative;z-index:1;max-width:600px;margin:32px auto;padding:0 20px}
.res-podium{display:flex;flex-direction:column;align-items:center;margin-bottom:32px}
.res-figure{width:120px;height:160px;margin-bottom:-8px}
.res-figure.celebrating{animation:celebrate .6s ease-in-out infinite alternate}
@keyframes celebrate{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-8px) rotate(2deg)}}
.res-title{font-family:'Playfair Display',serif;font-size:clamp(28px,6vw,48px);font-weight:900;color:#d4af37;text-align:center;text-shadow:0 0 36px rgba(212,175,55,.45);margin-bottom:24px}
.res-card{display:flex;align-items:center;gap:16px;border-radius:9px;border:1px solid rgba(212,175,55,.13);background:rgba(0,0,0,.28);padding:16px 20px;margin-bottom:10px}
.res-card.win{border-color:#d4af37;background:rgba(212,175,55,.07);box-shadow:0 0 34px rgba(212,175,55,.2)}
.res-rank{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;color:rgba(212,175,55,.36);width:34px;text-align:center;flex-shrink:0}
.res-rank.gold{color:#d4af37}
.res-info{flex:1;min-width:0}
.res-name{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:#e8dfc0}
.res-detail{font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:3px}
.res-total{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#d4af37;flex-shrink:0}
.res-total.bust{color:#e05555}
.again-btn{width:100%;padding:16px;margin-top:24px;border-radius:8px;border:2px solid #d4af37;background:transparent;color:#d4af37;font-family:'Playfair Display',serif;font-size:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.again-btn:hover{background:rgba(212,175,55,.09);box-shadow:0 0 24px rgba(212,175,55,.26)}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(212,175,55,.28);border-radius:2px}
`;

export default function App() {
  const [phase, setPhase] = useState("setup");
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
 const defaultCat = new URLSearchParams(window.location.search).get('cat') || null;
const [selectedCat, setSelectedCat] = useState(defaultCat);
  const [gameState, setGameState] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggIdx, setSuggIdx] = useState(-1);
  const [showSugg, setShowSugg] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingCard, setPendingCard] = useState(null);
  // cardPhase: null | "deal" | "flipped" | "exiting"
  const [cardPhase, setCardPhase] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateSuggestions = useCallback((val, catId, usedPool) => {
    if (!catId || val.length < 2) { setSuggestions([]); setShowSugg(false); return; }
    const results = fuzzySearch(val, PLAYER_DATA[catId], usedPool || new Set());
    setSuggestions(results); setShowSugg(results.length > 0); setSuggIdx(-1);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value; setInputValue(val); setErrorMsg("");
    if (gameState) updateSuggestions(val, gameState.cat.id, gameState.usedPool);
    else { setSuggestions([]); setShowSugg(false); }
  };

  const selectSuggestion = (player) => {
    setInputValue(player.name); setSuggestions([]); setShowSugg(false); setSuggIdx(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e) => {
    if (!showSugg || !suggestions.length) { if (e.key === "Enter") handleDeal(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSuggIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSuggIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") { e.preventDefault(); suggIdx >= 0 ? selectSuggestion(suggestions[suggIdx]) : handleDeal(); }
    else if (e.key === "Escape") setShowSugg(false);
  };

  useEffect(() => {
    const h = (e) => { if (!dropdownRef.current?.contains(e.target) && e.target !== inputRef.current) setShowSugg(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const startGame = () => {
    if (!selectedCat) return;
    const cat = STAT_CATEGORIES.find((c) => c.id === selectedCat);
    const pool = PLAYER_DATA[cat.id];
    const globalUsed = new Set();
    const names = playerNames.slice(0, numPlayers).map((n, i) => n.trim() || `Player ${i + 1}`);

    // Build players with cards hidden initially (fresh:false)
    const players = names.map((name) => {
      const hand = dealHandForPlayer(pool, cat.target, globalUsed);
      hand.forEach((c) => globalUsed.add(c.name));
      const cards = hand.map((c) => ({ ...c, revealed: true, isStarting: true, fresh: false, hidden: true }));
      const total = cards.reduce((s, c) => s + c.value, 0);
      return { name, cards, total, status: "active" };
    });

    setGameState({ cat, players, currentPlayer: 0, usedPool: globalUsed });
    setPhase("playing");
    setInputValue(""); setErrorMsg(""); setSuggestions([]); setShowSugg(false);

    // Deal cards one at a time: round-robin across players (card 0 p0, card 0 p1, card 0 p2, card 1 p0...)
    const dealOrder = [];
    const handSize = 2;
    for (let cardIdx = 0; cardIdx < handSize; cardIdx++) {
      for (let pIdx = 0; pIdx < names.length; pIdx++) {
        dealOrder.push({ pIdx, cardIdx });
      }
    }

    dealOrder.forEach(({ pIdx, cardIdx }, i) => {
      setTimeout(() => {
        setGameState((prev) => {
          const newPlayers = prev.players.map((p, pi) => {
            if (pi !== pIdx) return p;
            const newCards = p.cards.map((c, ci) =>
              ci === cardIdx ? { ...c, hidden: false, fresh: true } : c
            );
            return { ...p, cards: newCards };
          });
          return { ...prev, players: newPlayers };
        });
      }, i * 180 + 300); // 180ms between each card, 300ms initial delay
    });

    const focusDelay = dealOrder.length * 180 + 500;
    setTimeout(() => inputRef.current?.focus(), focusDelay);
  };

  const advanceTurn = (players, currentPlayer) => {
    let next = currentPlayer, loops = 0;
    do { next = (next + 1) % players.length; if (++loops > players.length) return -1; }
    while (players[next].status !== "active");
    return next;
  };

  const checkGameOver = (players) => players.every((p) => p.status !== "active");

  const handleDeal = () => {
    const raw = inputValue.trim(); if (!raw) return;
    const name = suggIdx >= 0 && suggestions[suggIdx] ? suggestions[suggIdx].name : raw;
    commitToCard(name);
  };

  const commitToCard = (playerName) => {
    const { usedPool, currentPlayer: cpIdx } = gameState;
    const pool = PLAYER_DATA[gameState.cat.id];
    const match = pool.find((p) => p.name.toLowerCase() === playerName.toLowerCase());
    if (!match) { setErrorMsg(`"${playerName}" not found. Try autocomplete.`); return; }
    if (usedPool.has(match.name)) { setErrorMsg(`${match.name} already used.`); return; }
    setErrorMsg(""); setSuggestions([]); setShowSugg(false);
    const newUsed = new Set(usedPool); newUsed.add(match.name);
    setGameState((prev) => ({ ...prev, usedPool: newUsed }));
    setPendingCard({ playerIdx: cpIdx, name: match.name, value: match.value });
    setCardPhase("deal");
    setInputValue("");
  };

  const handleCardClick = () => {
    if (cardPhase === "deal") {
      setCardPhase("flipped");
    } else if (cardPhase === "flipped") {
      setCardPhase("exiting");
      setTimeout(() => {
        commitCardToGame(pendingCard);
        setPendingCard(null);
        setCardPhase(null);
      }, 300);
    }
  };

  const commitCardToGame = ({ playerIdx, name, value }) => {
    setGameState((prev) => {
      const newPlayers = prev.players.map((p, i) => {
        if (i !== playerIdx) return p;
        const newCards = [...p.cards, { name, value, revealed: true, isStarting: false, fresh: true }];
        const newTotal = newCards.reduce((s, c) => s + c.value, 0);
        let status = p.status;
        if (newTotal === prev.cat.target) status = "blackjack";
        else if (newTotal > prev.cat.target) status = "bust";
        return { ...p, cards: newCards, total: newTotal, status };
      });
      if (checkGameOver(newPlayers)) { setTimeout(() => setPhase("results"), 600); return { ...prev, players: newPlayers }; }
      return { ...prev, players: newPlayers, currentPlayer: advanceTurn(newPlayers, playerIdx) };
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleStand = () => {
    setErrorMsg(""); setSuggestions([]); setShowSugg(false); setInputValue("");
    setGameState((prev) => {
      const newPlayers = prev.players.map((p, i) => i === prev.currentPlayer ? { ...p, status: "stood" } : p);
      if (checkGameOver(newPlayers)) { setTimeout(() => setPhase("results"), 400); return { ...prev, players: newPlayers }; }
      return { ...prev, players: newPlayers, currentPlayer: advanceTurn(newPlayers, prev.currentPlayer) };
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const getResults = () => {
    if (!gameState) return [];
    const { players, cat } = gameState;
    return [...players].sort((a, b) => {
      if (a.status === "blackjack") return -1; if (b.status === "blackjack") return 1;
      if (a.status === "bust" && b.status !== "bust") return 1;
      if (b.status === "bust" && a.status !== "bust") return -1;
      if (a.status === "bust" && b.status === "bust") return 0;
      return Math.abs(a.total - cat.target) - Math.abs(b.total - cat.target);
    });
  };

  const barColor = (p, target) => p.status === "bust" ? "#e05555" : p.status === "blackjack" ? "#d4af37" : p.total / target > .88 ? "#d4af37" : p.total / target > .6 ? "#a8c97f" : "#5aab6e";
  const totalCls = (p, target) => p.status === "blackjack" ? "t-bj" : p.status === "bust" ? "t-bust" : p.total / target > .83 ? "t-close" : "t-ok";
  const isWaiting = !!cardPhase;

  const Hdr = () => (
    <div className="bj-hdr">
      <div className="bj-logo">NFL <em>STAT</em> BLACKJACK</div>
      <div className="bj-sub">Hit the target. Don't bust.</div>
      <div className="bj-brand">A FanSided Game</div>
    </div>
  );

  // ── CINEMATIC CARD OVERLAY ─────────────────────────────────────────────────
  const CardOverlay = () => {
    if (!pendingCard || !cardPhase) return null;
    const { cat } = gameState;
    const isFlipped = cardPhase === "flipped" || cardPhase === "exiting";
    const isExiting = cardPhase === "exiting";
    return (
      <>
        <div className={`card-backdrop${isExiting ? " exiting" : ""}`} />
        <div className={`card-spotlight${isExiting ? " exiting" : ""}`} />
        <div className="card-stage">
          <div
            className={`card-container${isExiting ? " exiting" : ""}`}
            onClick={handleCardClick}
          >
            <div className="flip-scene">
              <div className={`flip-card${isFlipped ? " flipped" : ""}`}>
                {/* FRONT — player name */}
                <div className="flip-face flip-front">
                  <div className="flip-eyebrow">{cat.label}</div>
                  <div className="flip-player-name">{pendingCard.name}</div>
                  <div className="flip-divider" />
                  <div className="flip-cta">tap to reveal stat</div>
                </div>
                {/* BACK — stat */}
                <div className="flip-face flip-back">
                  <div className="flip-eyebrow">{cat.label}</div>
                  <div className="flip-stat-num">{fmt(pendingCard.value)}</div>
                  <div className="flip-stat-unit">{cat.unit}</div>
                  <div className="flip-divider" />
                  <div className="flip-stat-name">{pendingCard.name}</div>
                  <div className="flip-add-cta">tap to add to hand</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (phase === "setup") return (
    <><style>{CSS}</style>
    <div className="bj"><div className="felt" /><Hdr />
      <div className="setup">
        <div className="setup-sec">
          <div className="setup-lbl">Players</div>
          <div className="count-row">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} className={`cnt-btn${numPlayers === n ? " on" : ""}`} onClick={() => setNumPlayers(n)}>{n}</button>
            ))}
          </div>
        </div>
        <div className="setup-sec">
          <div className="setup-lbl">Player Names</div>
          <div className="names-grid">
            {Array.from({ length: numPlayers }).map((_, i) => (
              <input key={i} className="name-inp" placeholder={`Player ${i + 1}`} value={playerNames[i]}
                onChange={(e) => { const n = [...playerNames]; n[i] = e.target.value; setPlayerNames(n); }} maxLength={20} />
            ))}
          </div>
        </div>
        <div className="setup-sec">
          <div className="setup-lbl">Stat Category</div>
          <div className="cat-grid">
            {STAT_CATEGORIES.map((c) => (
              <button key={c.id} className={`cat-btn${selectedCat === c.id ? " on" : ""}`} onClick={() => setSelectedCat(c.id)}>
                <div className="cat-nm">{c.label}</div>
                <div className="cat-tgt">Target: {fmt(c.target)}</div>
              </button>
            ))}
          </div>
        </div>
        <button className="deal-in" disabled={!selectedCat} onClick={startGame}>Deal In</button>
      </div>
    </div></>
  );

  if (phase === "playing" && gameState) {
    const { cat, players, currentPlayer: cpIdx } = gameState;
    const cp = players[cpIdx];
    return (
      <><style>{CSS}</style>
      <div className="bj"><div className="felt" /><Hdr />
        <div className="play">
          <div className="tgt-banner">
            <div className="tgt-cat">{cat.label} · {cat.description}</div>
            <div className="tgt-num">{fmt(cat.target)}</div>
            <div className="tgt-lbl">Target · {cat.unit}</div>
          </div>
          <div className="players-row">
            {players.map((p, i) => (
              <div key={i} className={`panel${i === cpIdx && p.status === "active" ? " active-turn" : ""} ${p.status !== "active" ? p.status : ""}`}>
                {i === cpIdx && p.status === "active" && <div className="turn-dot" />}
                <div className="p-name">{p.name}</div>
                <div className={`p-status s-${p.status}`}>
                  {p.status === "active" ? (i === cpIdx ? "▶ Your Turn" : "Waiting") : p.status === "stood" ? "Standing" : p.status === "bust" ? "BUST" : "🃏 BLACKJACK!"}
                </div>
                <div className={`p-total ${totalCls(p, cat.target)}`}>{fmt(p.total)}</div>
                <div className="prog-bg">
                  <div className="prog-fill" style={{ width: `${Math.min(p.total / cat.target * 100, 100)}%`, background: barColor(p, cat.target) }} />
                </div>
                <div className="cards-list">
                  {p.cards.map((c, ci) => {
                    if (c.hidden) return <div key={ci} className="card-row card-placeholder" />;
                    return (
                      <div key={ci}
                        className={`card-row${c.isStarting ? " starting" : " dealt"}${c.fresh ? (c.isStarting ? " deal-in" : " compress-in") : ""}`}
                        onAnimationEnd={() => {
                          setGameState((prev) => {
                            const np = prev.players.map((pl, pi) => pi !== i ? pl : { ...pl, cards: pl.cards.map((cd, cdi) => cdi === ci ? { ...cd, fresh: false } : cd) });
                            return { ...prev, players: np };
                          });
                        }}>
                        <span className="c-name">{c.name}{c.isStarting && <span className="c-badge">deal</span>}</span>
                        <span className="c-val">{fmt(c.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {cp && cp.status === "active" && (
            <div className="inp-area">
              <div className="turn-ind">
                <div className="turn-nm">{cp.name}</div>
                <div className="turn-sb">Name a player · {fmt(cat.target - cp.total)} {cat.unit} remaining</div>
              </div>
              <div className="inp-wrap">
                <div className="inp-row">
                  <input ref={inputRef} className="pl-input" placeholder="e.g. Tom Brady"
                    value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
                    autoComplete="off" disabled={isWaiting} />
                  <button className="deal-btn" onClick={handleDeal} disabled={isWaiting}>Deal</button>
                </div>
                {showSugg && suggestions.length > 0 && !isWaiting && (
                  <div className="suggs" ref={dropdownRef}>
                    {suggestions.map((s, i) => (
                      <div key={s.name} className={`sug-item${i === suggIdx ? " hi" : ""}`} onMouseDown={() => selectSuggestion(s)}>
                        <span className="sug-nm">{s.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="stand-btn" onClick={handleStand} disabled={isWaiting}>Stand (Tap Out)</button>
              {errorMsg && <div className="err">{errorMsg}</div>}
            </div>
          )}
        </div>
        <CardOverlay />
      </div></>
    );
  }

  if (phase === "results" && gameState) {
    const ranked = getResults();
    const { cat } = gameState;
    const winner = ranked[0];
    const winnerWon = winner && winner.status !== "bust";
    return (
      <><style>{CSS}</style>
      <div className="bj"><div className="felt" /><Hdr />
        <div className="results">
          {/* Celebrating player figure */}
          <div className="res-podium">
            <div className={`res-figure${winnerWon ? " celebrating" : ""}`}>
              <FootballPlayer won={winnerWon} />
            </div>
          </div>
          <div className="res-title">
            {winner?.status === "blackjack" ? "🃏 Blackjack!" : "Final Results"}
          </div>
          {ranked.map((p, i) => (
            <div key={i} className={`res-card${i === 0 ? " win" : ""}`}>
              <div className={`res-rank${i === 0 ? " gold" : ""}`}>{i + 1}</div>
              <div className="res-info">
                <div className="res-name">{p.name}</div>
                <div className="res-detail" style={{ color: p.status === "bust" ? "#e05555" : p.status === "blackjack" ? "#d4af37" : "rgba(232,223,192,.45)" }}>
                  {p.status === "blackjack" ? "Exact target hit!" : p.status === "bust" ? `Bust · over by ${fmt(p.total - cat.target)}` : `${fmt(Math.abs(p.total - cat.target))} ${cat.unit} from target`}
                </div>
              </div>
              <div className={`res-total${p.status === "bust" ? " bust" : ""}`}>{p.status === "bust" ? "BUST" : fmt(p.total)}</div>
            </div>
          ))}
          <button className="again-btn" onClick={() => { setPhase("setup"); setSelectedCat(null); setGameState(null); setInputValue(""); setErrorMsg(""); setPendingCard(null); setCardPhase(null); }}>New Game</button>
        </div>
      </div></>
    );
  }

  return null;
}
