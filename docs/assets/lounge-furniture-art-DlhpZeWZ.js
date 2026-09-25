import{i as e}from"./lounge-bedroom-catalog-DEIbI0Au.js";var t=200,n=`#5a4636`,r=(e,r)=>`data:image/svg+xml;charset=utf-8,`+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${Math.round(e)}" viewBox="0 0 ${t} ${Math.round(e)}"><g stroke="${n}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${r}</g></svg>`),i=(e,t,n,r,i=8)=>`<rect x="${e}" y="${t}" width="${n}" height="${r}" rx="${i}" fill="#000" opacity=".08" stroke="none"/>`,a=(e,t,n,r)=>`<path d="M${e} ${t} L${n} ${r}" stroke="#fff" stroke-width="5" opacity=".45" fill="none"/>`,o=(e,t,n)=>r=>`
  <rect x="8" y="${r*.08}" width="184" height="${r*.45}" rx="16" fill="${e}"/>
  <rect x="14" y="${r*.4}" width="172" height="${r*.36}" rx="10" fill="${t}"/>
  <rect x="26" y="${r*.3}" width="62" height="${r*.16}" rx="12" fill="#fffaf0"/>
  <rect x="112" y="${r*.3}" width="62" height="${r*.16}" rx="12" fill="#fffaf0"/>
  <path d="M14 ${r*.52} H186 V${r*.8} Q100 ${r*.86} 14 ${r*.8}Z" fill="${n}"/>
  <rect x="8" y="${r*.76}" width="184" height="${r*.14}" rx="6" fill="${e}"/>
  <rect x="12" y="${r*.9}" width="14" height="${r*.09}" fill="${e}"/><rect x="174" y="${r*.9}" width="14" height="${r*.09}" fill="${e}"/>
  ${a(30,r*.14,170,r*.14)}`,s=(e,t)=>n=>`
  <rect x="14" y="${n*.12}" width="172" height="${n*.5}" rx="22" fill="${e}"/>
  <rect x="6" y="${n*.38}" width="36" height="${n*.42}" rx="14" fill="${e}"/>
  <rect x="158" y="${n*.38}" width="36" height="${n*.42}" rx="14" fill="${e}"/>
  <rect x="36" y="${n*.5}" width="128" height="${n*.28}" rx="12" fill="${e}"/>
  <path d="M100 ${n*.52} V${n*.76}" fill="none"/>
  ${i(36,n*.66,128,n*.1)}
  <rect x="20" y="${n*.8}" width="160" height="${n*.06}" rx="3" fill="${t}"/>
  <rect x="26" y="${n*.86}" width="10" height="${n*.12}" fill="${t}"/><rect x="164" y="${n*.86}" width="10" height="${n*.12}" fill="${t}"/>
  ${a(40,n*.2,150,n*.2)}`,c=e=>t=>`
  <rect x="34" y="${t*.06}" width="132" height="${t*.56}" rx="36" fill="${e}"/>
  <rect x="10" y="${t*.36}" width="46" height="${t*.46}" rx="20" fill="${e}"/>
  <rect x="144" y="${t*.36}" width="46" height="${t*.46}" rx="20" fill="${e}"/>
  <rect x="48" y="${t*.52}" width="104" height="${t*.28}" rx="14" fill="${e}"/>
  ${i(48,t*.68,104,t*.12)}
  <rect x="30" y="${t*.82}" width="12" height="${t*.16}" rx="4" fill="#8a5a34"/><rect x="158" y="${t*.82}" width="12" height="${t*.16}" rx="4" fill="#8a5a34"/>
  ${a(60,t*.14,130,t*.14)}`,l=(e,t,n)=>r=>{let i=r*.04,a=r*.96,o=(a-i-20)/n,s=``,c=[`#d9534f`,`#5b8fb9`,`#e9c46a`,`#7dbb5d`,`#b07ab9`,`#f28c28`];for(let e=0;e<n;e++){let n=i+10+e*o,r=26,a=e*2;for(;r<160;){let e=12+a*7%9,t=o*(.6+a*13%4*.08);s+=`<rect x="${r}" y="${n+o-t-4}" width="${e}" height="${t}" rx="2" fill="${c[a%c.length]}" stroke-width="2"/>`,r+=e+3,a++}s+=`<rect x="18" y="${n+o-4}" width="164" height="7" fill="${t}" stroke-width="2"/>`}return`<rect x="12" y="${i}" width="176" height="${a-i}" rx="6" fill="${e}"/>
    <rect x="22" y="${i+8}" width="156" height="${a-i-16}" fill="${t}" opacity=".45"/>${s}`},u=(e,t)=>n=>`
  <rect x="14" y="${n*.04}" width="172" height="${n*.88}" rx="8" fill="${e}"/>
  <path d="M100 ${n*.08} V${n*.88}" fill="none"/>
  <rect x="26" y="${n*.1}" width="64" height="${n*.74}" rx="6" fill="#fff" opacity=".35"/>
  <rect x="110" y="${n*.1}" width="64" height="${n*.74}" rx="6" fill="#fff" opacity=".35"/>
  <circle cx="90" cy="${n*.48}" r="5" fill="${t}"/><circle cx="110" cy="${n*.48}" r="5" fill="${t}"/>
  <rect x="22" y="${n*.92}" width="14" height="${n*.07}" fill="${e}"/><rect x="164" y="${n*.92}" width="14" height="${n*.07}" fill="${e}"/>
  ${a(30,n*.14,30,n*.6)}`,d=(e,t,n,r=!1)=>i=>{if(r){let n=``;for(let e=0;e<6;e++)for(let r=0;r<8;r++)(r+e)%2&&(n+=`<rect x="${12+r*22}" y="${i*.08+e*i*.84/6}" width="22" height="${i*.84/6}" fill="${t}" stroke="none" opacity=".8"/>`);return`<rect x="12" y="${i*.08}" width="176" height="${i*.84}" rx="10" fill="${e}"/>${n}<rect x="12" y="${i*.08}" width="176" height="${i*.84}" rx="10" fill="none"/>`}return`<ellipse cx="100" cy="${i/2}" rx="92" ry="${i*.44}" fill="${e}"/>
    <ellipse cx="100" cy="${i/2}" rx="70" ry="${i*.32}" fill="${t}" stroke-width="2"/>
    <ellipse cx="100" cy="${i/2}" rx="42" ry="${i*.18}" fill="${n}" stroke-width="2"/>`},f=(e,t,n=`#c86f4a`)=>`<path d="M66 ${t} H134 L124 ${e-6} H76Z" fill="${n}"/><rect x="60" y="${t-10}" width="80" height="14" rx="5" fill="${n}"/>`,p={"furn-plant":e=>`${f(e,e*.62)}
    <path d="M100 ${e*.6} C80 ${e*.4} 60 ${e*.36} 44 ${e*.3} C64 ${e*.22} 88 ${e*.34} 100 ${e*.52}" fill="#6aa84f"/>
    <path d="M100 ${e*.6} C120 ${e*.4} 140 ${e*.34} 158 ${e*.26} C136 ${e*.2} 112 ${e*.34} 100 ${e*.5}" fill="#7dbb5d"/>
    ${[70,100,130].map((t,n)=>`<circle cx="${t}" cy="${e*(.18+n*.04)}" r="14" fill="${[`#f28bb5`,`#f5d34b`,`#e2334a`][n]}"/><circle cx="${t}" cy="${e*(.18+n*.04)}" r="5" fill="#fff3a8" stroke-width="2"/>`).join(``)}`,"furn-chair":e=>`
    <rect x="44" y="${e*.06}" width="112" height="${e*.4}" rx="10" fill="#e9c46a"/>
    <path d="M56 ${e*.14} H144 M56 ${e*.24} H144 M56 ${e*.34} H144" stroke="#c99a3c" fill="none"/>
    <rect x="34" y="${e*.46}" width="132" height="${e*.14}" rx="6" fill="#d9ad5a"/>
    <path d="M44 ${e*.6} L36 ${e*.96} M156 ${e*.6} L164 ${e*.96} M70 ${e*.6} L74 ${e*.9} M130 ${e*.6} L126 ${e*.9}" stroke-width="7" fill="none" stroke="#9a6538"/>`,"furn-lamp":e=>`
    <path d="M60 ${e*.1} H140 L160 ${e*.46} H40Z" fill="#fff1c8"/>
    ${[70,100,130].map(t=>`<path d="M${t} ${e*.22} l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#f5c518" stroke-width="1.5"/>`).join(``)}
    <rect x="94" y="${e*.46}" width="12" height="${e*.38}" fill="#b08a5a"/>
    <ellipse cx="100" cy="${e*.9}" rx="46" ry="${e*.06}" fill="#8a6a4a"/>
    <ellipse cx="100" cy="${e*.3}" rx="90" ry="${e*.26}" fill="#fff3a8" opacity=".25" stroke="none"/>`,"furn-tent":e=>`
    <path d="M100 ${e*.06} L8 ${e*.94} H192Z" fill="#e97f5a"/>
    <path d="M100 ${e*.06} L60 ${e*.94} H140Z" fill="#fbe3c8"/>
    <path d="M100 ${e*.3} L78 ${e*.94} H122Z" fill="#5a4636" opacity=".85"/>
    <path d="M100 ${e*.06} V0" stroke-width="4"/><path d="M100 2 l16 6 -16 6z" fill="#f5c518" stroke-width="2"/>
    <path d="M30 ${e*.94} L20 ${e} M170 ${e*.94} L180 ${e}" fill="none"/>`,"furn-table":e=>`
    <rect x="6" y="${e*.16}" width="188" height="${e*.14}" rx="6" fill="#b9854a"/>
    ${a(20,e*.2,180,e*.2)}
    <rect x="18" y="${e*.3}" width="14" height="${e*.66}" fill="#9a6538"/><rect x="168" y="${e*.3}" width="14" height="${e*.66}" fill="#9a6538"/>
    <rect x="30" y="${e*.3}" width="140" height="${e*.08}" fill="#9a6538"/>
    <ellipse cx="100" cy="${e*.12}" rx="18" ry="${e*.05}" fill="#fff" /><path d="M100 ${e*.02} v${e*.08}" stroke="#7dbb5d" stroke-width="4"/>`,"furn-sofa":s(`#e8b77a`,`#8a5a34`),"furn-bookshelf":l(`#b9854a`,`#6b4222`,4),"furn-logbed":o(`#a8743f`,`#f6efe2`,`#7fae8a`),"furn-rug":d(`#f6efe2`,`#d9534f`,`#fff`,!0),"furn-bench":e=>`
    <rect x="6" y="${e*.08}" width="188" height="${e*.14}" rx="5" fill="#b9854a"/><rect x="6" y="${e*.26}" width="188" height="${e*.14}" rx="5" fill="#b9854a"/>
    <rect x="2" y="${e*.48}" width="196" height="${e*.14}" rx="5" fill="#a8743f"/>
    <path d="M20 ${e*.1} L16 ${e*.96} M180 ${e*.1} L184 ${e*.96}" stroke="#3d3d3d" stroke-width="8" fill="none"/>`,"furn-fence":e=>`<rect x="4" y="${e*.36}" width="192" height="${e*.12}" fill="#e9dcc2"/><rect x="4" y="${e*.64}" width="192" height="${e*.12}" fill="#e9dcc2"/>
    ${[10,50,90,130,170].map(t=>`<path d="M${t} ${e*.98} V${e*.14} L${t+10} ${e*.02} L${t+20} ${e*.14} V${e*.98}Z" fill="#fbf4e4"/>`).join(``)}`,"furn-fountain":e=>`
    <ellipse cx="100" cy="${e*.82}" rx="94" ry="${e*.14}" fill="#c9c3b6"/>
    <ellipse cx="100" cy="${e*.78}" rx="80" ry="${e*.09}" fill="#8fd0e6"/>
    <rect x="88" y="${e*.36}" width="24" height="${e*.42}" fill="#d9d3c6"/>
    <ellipse cx="100" cy="${e*.36}" rx="46" ry="${e*.07}" fill="#d9d3c6"/>
    <path d="M100 ${e*.34} C80 ${e*.1} 60 ${e*.2} 56 ${e*.4} M100 ${e*.34} C120 ${e*.1} 140 ${e*.2} 144 ${e*.4}" stroke="#8fd0e6" stroke-width="6" fill="none"/>`,"furn-radio":e=>`
    <rect x="10" y="${e*.2}" width="180" height="${e*.72}" rx="18" fill="#c98a4a"/>
    <circle cx="62" cy="${e*.56}" r="${e*.24}" fill="#f2e6c8"/>
    <circle cx="62" cy="${e*.56}" r="${e*.14}" fill="none" stroke-width="2"/>
    <rect x="112" y="${e*.36}" width="62" height="${e*.18}" rx="4" fill="#fff7d6"/>
    <circle cx="126" cy="${e*.74}" r="10" fill="#6b4222"/><circle cx="160" cy="${e*.74}" r="10" fill="#6b4222"/>
    <path d="M40 ${e*.2} L70 0" stroke-width="3"/>`,"furn-planter":e=>`
    <rect x="6" y="${e*.5}" width="188" height="${e*.46}" rx="6" fill="#a8743f"/>
    <path d="M6 ${e*.66} H194 M6 ${e*.82} H194" stroke="#8a5a34" fill="none"/>
    ${[30,62,94,126,158].map((t,n)=>`<path d="M${t+6} ${e*.5} V${e*.24}" stroke="#4f8a3c" stroke-width="4"/><circle cx="${t+6}" cy="${e*.2}" r="14" fill="${[`#f28bb5`,`#f5d34b`,`#e2334a`,`#b07ab9`,`#f7a8c9`][n]}"/><circle cx="${t+6}" cy="${e*.2}" r="5" fill="#fff3a8" stroke-width="2"/>`).join(``)}`,"furn-fireplace":e=>`
    <rect x="6" y="${e*.1}" width="188" height="${e*.88}" rx="6" fill="#c9785a"/>
    <path d="M6 ${e*.3} H194 M6 ${e*.5} H194 M6 ${e*.7} H194" stroke="#a45a3e" fill="none" stroke-width="2"/>
    <rect x="0" y="${e*.04}" width="200" height="${e*.1}" rx="4" fill="#8a5a34"/>
    <path d="M48 ${e*.98} V${e*.48} Q100 ${e*.26} 152 ${e*.48} V${e*.98}Z" fill="#3d2f25"/>
    <path d="M100 ${e*.9} C74 ${e*.84} 82 ${e*.66} 96 ${e*.56} C96 ${e*.68} 110 ${e*.66} 112 ${e*.58} C126 ${e*.7} 124 ${e*.86} 100 ${e*.9}Z" fill="#f5a623"/>
    <path d="M100 ${e*.9} C90 ${e*.86} 92 ${e*.76} 100 ${e*.7} C108 ${e*.76} 110 ${e*.86} 100 ${e*.9}Z" fill="#fff1a8" stroke-width="2"/>`,"furn-fruit-tree":e=>`
    ${f(e,e*.78,`#e0b27a`)}
    <rect x="92" y="${e*.46}" width="16" height="${e*.34}" fill="#8a5a34"/>
    <circle cx="100" cy="${e*.3}" r="${e*.24}" fill="#5e9d4c"/>
    <circle cx="70" cy="${e*.38}" r="${e*.14}" fill="#6aa84f"/><circle cx="132" cy="${e*.36}" r="${e*.14}" fill="#6aa84f"/>
    ${[[80,.22],[118,.2],[100,.36],[66,.4],[136,.4],[96,.14]].map(([t,n])=>`<circle cx="${t}" cy="${e*n}" r="9" fill="#f28c28" stroke-width="2"/>`).join(``)}`,"furn-bed-mint":o(`#9fd8c8`,`#fbfaf5`,`#7cc9b4`),"furn-sofa-rose":s(`#e8a3b1`,`#8a5a4a`),"furn-armchair-navy":c(`#3f5a86`),"furn-rug-lilac":d(`#d9c8ee`,`#c3aee3`,`#ece2f8`),"furn-bookcase-walnut":l(`#6b4a33`,`#3e2a1c`,5),"furn-wardrobe-white":u(`#f6f2ea`,`#c9a36a`),"furn-cherry-vase":e=>`
    <path d="M78 ${e*.62} C66 ${e*.72} 70 ${e*.96} 100 ${e*.96} C130 ${e*.96} 134 ${e*.72} 122 ${e*.62} V${e*.54} H78Z" fill="#8fb8d9"/>
    <path d="M100 ${e*.56} C96 ${e*.36} 72 ${e*.24} 56 ${e*.1} M100 ${e*.56} C108 ${e*.34} 130 ${e*.22} 150 ${e*.08} M100 ${e*.5} C102 ${e*.34} 98 ${e*.2} 102 ${e*.04}" stroke="#6b4222" stroke-width="4" fill="none"/>
    ${[[56,.1],[72,.2],[150,.08],[132,.2],[102,.05],[96,.22],[118,.3],[80,.32]].map(([t,n])=>`<circle cx="${t}" cy="${e*n}" r="11" fill="#f7c1d2" stroke-width="2"/><circle cx="${t}" cy="${e*n}" r="3" fill="#e2708f" stroke="none"/>`).join(``)}`,"furn-fan":e=>`
    <circle cx="100" cy="${e*.28}" r="${e*.24}" fill="#bfe3d9"/>
    ${[0,72,144,216,288].map(t=>`<ellipse cx="100" cy="${e*.18}" rx="16" ry="${e*.08}" fill="#fff" stroke-width="2" transform="rotate(${t} 100 ${e*.28})"/>`).join(``)}
    <circle cx="100" cy="${e*.28}" r="10" fill="#6fb3a3"/>
    <rect x="94" y="${e*.52}" width="12" height="${e*.36}" fill="#6fb3a3"/>
    <ellipse cx="100" cy="${e*.92}" rx="52" ry="${e*.05}" fill="#6fb3a3"/>`,"furn-maple-garland":e=>`<path d="M4 ${e*.2} Q100 ${e*.62} 196 ${e*.2}" fill="none" stroke-width="3"/>
    ${Array.from({length:9},(t,n)=>`<path d="M${14+n*21.5} ${e*.2+Math.sin(n/8*Math.PI)*e*.3} l-10 8 4 2 -8 10 10 -2 4 12 4 -12 10 2 -8 -10 4 -2z" fill="${[`#e0823a`,`#d9452f`,`#f2b233`][n%3]}" stroke-width="2"/>`).join(``)}`,"furn-snowman":e=>`
    <circle cx="100" cy="${e*.7}" r="${e*.26}" fill="#fbfdff"/>
    <circle cx="100" cy="${e*.32}" r="${e*.18}" fill="#fbfdff"/>
    <path d="M66 ${e*.18} H134 L124 ${e*.02} H76Z" fill="#3d3d4a"/><rect x="58" y="${e*.16}" width="84" height="10" rx="4" fill="#3d3d4a"/>
    <circle cx="90" cy="${e*.3}" r="4" fill="${n}"/><circle cx="110" cy="${e*.3}" r="4" fill="${n}"/>
    <path d="M100 ${e*.35} l22 5 -22 4z" fill="#f28c28" stroke-width="2"/>
    <path d="M70 ${e*.48} Q100 ${e*.56} 130 ${e*.48} L136 ${e*.62} L124 ${e*.6}" fill="#d9452f"/>`,"furn-moon-lantern":e=>`
    <path d="M100 0 V${e*.12}" stroke-width="3"/>
    <circle cx="100" cy="${e*.5}" r="${e*.36}" fill="#ffe7a0"/>
    <circle cx="100" cy="${e*.5}" r="${e*.44}" fill="#fff3c0" opacity=".35" stroke="none"/>
    <circle cx="84" cy="${e*.42}" r="10" fill="#f2d27a" stroke="none"/><circle cx="116" cy="${e*.58}" r="7" fill="#f2d27a" stroke="none"/>
    <rect x="80" y="${e*.1}" width="40" height="${e*.06}" rx="3" fill="#b9854a"/><rect x="80" y="${e*.86}" width="40" height="${e*.06}" rx="3" fill="#b9854a"/>
    <path d="M100 ${e*.92} V${e}" stroke="#d9452f" stroke-width="4"/>`,"furn-lucky-pouch":e=>`
    <path d="M60 ${e*.34} C20 ${e*.5} 26 ${e*.94} 100 ${e*.94} C174 ${e*.94} 180 ${e*.5} 140 ${e*.34}Z" fill="#d9313f"/>
    <path d="M60 ${e*.34} C70 ${e*.2} 130 ${e*.2} 140 ${e*.34}" fill="#e9c46a"/>
    <path d="M70 ${e*.3} Q100 ${e*.4} 130 ${e*.3}" stroke="#f5c518" stroke-width="5" fill="none"/>
    <circle cx="100" cy="${e*.64}" r="${e*.12}" fill="#f5c518"/>
    <path d="M100 ${e*.56} v${e*.16} M92 ${e*.6} h16 M92 ${e*.68} h16" stroke="#d9313f" stroke-width="3" fill="none"/>
    <path d="M100 ${e*.2} V${e*.02}" stroke-width="3"/>`,"furn-jack-lantern":e=>`
    <ellipse cx="100" cy="${e*.58}" rx="88" ry="${e*.38}" fill="#ee8a2c"/>
    <path d="M100 ${e*.2} C80 ${e*.3} 80 ${e*.86} 100 ${e*.96} M100 ${e*.2} C120 ${e*.3} 120 ${e*.86} 100 ${e*.96}" stroke="#b85f14" fill="none"/>
    <path d="M60 ${e*.46} l14 -14 14 14z M112 ${e*.46} l14 -14 14 14z" fill="#fff1a8"/>
    <path d="M56 ${e*.66} Q100 ${e*.92} 144 ${e*.66} l-12 4 -8 -8 -10 10 -14 -10 -14 10 -10 -10 -8 8z" fill="#fff1a8"/>
    <path d="M100 ${e*.22} C98 ${e*.1} 106 ${e*.04} 116 ${e*.02}" stroke="#5b7a2e" stroke-width="7" fill="none"/>`,"furn-xmas-tree":e=>`
    <path d="M100 ${e*.04} L40 ${e*.36} H70 L24 ${e*.62} H62 L12 ${e*.86} H188 L138 ${e*.62} H176 L130 ${e*.36} H160Z" fill="#3f8a4c"/>
    <rect x="88" y="${e*.86}" width="24" height="${e*.12}" fill="#8a5a34"/>
    <path d="M100 2 l5 10 11 1 -8 7 3 11 -11 -6 -11 6 3 -11 -8 -7 11 -1z" fill="#f5c518" stroke-width="2"/>
    ${[[80,.3],[120,.44],[70,.56],[134,.66],[90,.72],[60,.8],[148,.8],[110,.24]].map(([t,n],r)=>`<circle cx="${t}" cy="${e*n}" r="7" fill="${[`#e2334a`,`#f5c518`,`#5b8fb9`,`#fff`][r%4]}" stroke-width="2"/>`).join(``)}`,"furn-village-medal":e=>`
    <path d="M70 0 L86 ${e*.36} M130 0 L114 ${e*.36}" stroke="#5b8fb9" stroke-width="10"/>
    <circle cx="100" cy="${e*.62}" r="${e*.3}" fill="#e9c46a"/>
    <circle cx="100" cy="${e*.62}" r="${e*.22}" fill="#f5d77a" stroke-width="2"/>
    <path d="M100 ${e*.46} l8 15 17 2 -12 11 3 17 -16 -8 -16 8 3 -17 -12 -11 17 -2z" fill="#fff6c8" stroke-width="2"/>`};function m(n){let r=e(n);if(!r)return t;let i=r.mount===`rug`?r.d/r.w:r.h/r.w;return Math.max(40,Math.min(t*3,t*i))}var h=Object.fromEntries(Object.entries(p).map(([e,t])=>{let n=m(e);return[e,r(n,t(n))]}));export{h as t};