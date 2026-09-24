/** Original fan-room illustrations. No third-party merchandise artwork is bundled. */
const svg = (body: string, width = 300, height = 300) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`)}`;

const singer = `<path d="M113 67Q59 51 59 102L43 230Q73 225 89 153L104 109M184 67Q235 53 239 103L256 230Q222 222 210 153L195 108" fill="#60bbb2"/><path d="M70 91L58 199M227 93L243 196" stroke="#a4ddd0" stroke-width="9" fill="none"/><path d="M110 176L102 243H126L142 193M166 187L179 243H202L184 170" fill="#384852"/><path d="M103 241H128V258H93Q87 247 103 241M178 242H202L214 254V259H177" fill="#223943"/><path d="M118 123L95 174Q144 198 198 175L177 122" fill="#3c5159"/><path d="M119 122L105 166Q148 183 187 165L177 122" fill="#dadfda"/><path d="M146 122L139 156L151 165L161 153L152 122" fill="#65c2b6"/><path d="M119 123L102 158L86 150L104 119M177 123L198 156L212 145L193 116" fill="#e8c9b7"/><path d="M101 149L89 146L77 174L91 182M197 148L208 141L223 167L209 177" fill="#36464e"/><ellipse cx="149" cy="91" rx="43" ry="39" fill="#f0d7c1"/><path d="M103 95Q93 39 149 41Q204 37 198 94L180 78L172 64L154 91L141 68L126 89L123 69Z" fill="#68c5bc"/><path d="M105 61L99 98M194 61L201 98" stroke="#35454f" stroke-width="10"/><path d="M103 70L99 84M197 70L201 84" stroke="#cf7e98" stroke-width="5"/><ellipse cx="133" cy="94" rx="4.5" ry="7" fill="#366b70"/><ellipse cx="166" cy="94" rx="4.5" ry="7" fill="#366b70"/><path d="M143 110Q150 115 157 109" fill="none" stroke="#bc847d" stroke-width="3" stroke-linecap="round"/><circle cx="119" cy="106" r="5" fill="#edb4aa"/><circle cx="180" cy="106" r="5" fill="#edb4aa"/>`;

export const MIKU_ROOM_ART = {
  'miku-poster': svg(
    `<rect x="15" y="8" width="270" height="384" rx="5" fill="#624f42"/><rect x="22" y="15" width="256" height="370" fill="#f3edda"/><circle cx="150" cy="175" r="107" fill="#cce4d8"/><path d="M35 302H265M35 320H265" stroke="#a8c8bd"/><text x="35" y="53" font-family="sans-serif" font-size="19" letter-spacing="5" fill="#365b59">HATSUNE MIKU</text><g transform="translate(0 36)">${singer}</g><text x="37" y="350" font-family="sans-serif" font-size="14" letter-spacing="3" fill="#37605a">SOUND OF TOMORROW</text><text x="37" y="371" font-family="sans-serif" font-size="9" letter-spacing="4" fill="#877a61">01 / ROOM COLLECTION</text>`,
    300,
    400,
  ),
  'miku-records': svg(
    `<rect x="10" y="22" width="135" height="154" rx="5" fill="#dce7dc" stroke="#b3bdab" stroke-width="3"/><circle cx="168" cy="108" r="78" fill="#2c3f41"/><circle cx="168" cy="108" r="64" fill="none" stroke="#4c6160" stroke-width="2"/><circle cx="168" cy="108" r="48" fill="none" stroke="#4c6160"/><circle cx="168" cy="108" r="24" fill="#88c4b4"/><circle cx="168" cy="108" r="5" fill="#f4e7ce"/><rect x="20" y="30" width="115" height="138" fill="#f1e4cc"/><path d="M23 110Q75 11 131 112V144H23" fill="#8bcabc"/><text x="33" y="63" font-size="22" font-family="sans-serif" fill="#355c59">MIKU</text><text x="32" y="149" font-size="11" font-family="sans-serif" fill="#f8f1dd">SIDE A / 01</text><rect x="168" y="121" width="110" height="120" rx="4" fill="#e9c4b8" stroke="#bb9c8c" stroke-width="3"/><circle cx="224" cy="174" r="34" fill="#eee6d1"/><path d="M193 178Q225 113 254 177" fill="#6aada0"/><text x="179" y="227" font-size="11" font-family="sans-serif" fill="#755f51">LIVE COLLECTION</text>`,
    300,
    260,
  ),
  'miku-banner': svg(
    `<path d="M52 23H228V292L140 328L52 292Z" fill="#e8e8d1" stroke="#bcbd9d" stroke-width="3"/><rect x="35" y="16" width="210" height="12" rx="6" fill="#8a7452"/><path d="M69 38H211V283L140 312L69 283Z" fill="#aad7c6"/><text x="140" y="156" text-anchor="middle" font-family="sans-serif" font-size="88" font-weight="700" fill="#356e69">01</text><path d="M96 185Q139 147 184 185M104 212H176" stroke="#f2ebce" stroke-width="7" fill="none"/><text x="140" y="259" text-anchor="middle" font-family="sans-serif" font-size="13" letter-spacing="5" fill="#356e69">MIKU</text>`,
    280,
    340,
  ),
  'miku-acrylic': svg(
    `<ellipse cx="150" cy="276" rx="78" ry="13" fill="#517e7b" opacity=".23"/><ellipse cx="150" cy="264" rx="68" ry="13" fill="#b9ded5" stroke="#78afa7" stroke-width="3"/><path d="M106 44Q143 19 190 43L258 239L207 266H90L40 234Z" fill="#f7fffa" opacity=".65" stroke="#afcdc4" stroke-width="4"/>${singer}`,
  ),
  'miku-light-stick': svg(
    `<ellipse cx="150" cy="267" rx="67" ry="13" fill="#3e6c69" opacity=".19"/><path d="M94 207L87 66Q97 43 115 65L122 205M169 205L185 62Q207 45 214 68L197 210" fill="#a1edcd" stroke="#62aa99" stroke-width="5"/><path d="M90 196L125 195L130 253Q112 271 94 254M167 195L201 204L192 259Q171 269 157 250" fill="#e9e6da" stroke="#7f8f80" stroke-width="4"/><path d="M111 219L115 242M178 218L173 242" stroke="#6eada0" stroke-width="6"/><path d="M75 103L45 89M125 85L145 68M222 108L246 100" stroke="#a1d5bf" stroke-width="5" stroke-linecap="round"/>`,
  ),
  'miku-headphones': svg(
    `<ellipse cx="150" cy="270" rx="77" ry="15" fill="#476860" opacity=".19"/><ellipse cx="150" cy="251" rx="65" ry="16" fill="#a5b6a7"/><path d="M149 248V99" stroke="#7c8273" stroke-width="13"/><path d="M72 159V109Q74 41 150 40Q226 44 228 109V159" fill="none" stroke="#364d51" stroke-width="26"/><path d="M75 110Q75 52 150 51Q224 52 225 110" fill="none" stroke="#80c7b8" stroke-width="10"/><rect x="55" y="125" width="46" height="87" rx="17" fill="#69b5aa" stroke="#3d5555" stroke-width="7"/><rect x="199" y="125" width="46" height="87" rx="17" fill="#69b5aa" stroke="#3d5555" stroke-width="7"/><rect x="61" y="145" width="12" height="45" rx="4" fill="#da92a7"/><rect x="226" y="145" width="12" height="45" rx="4" fill="#da92a7"/><path d="M222 202Q254 252 211 261" stroke="#364d51" stroke-width="4" fill="none"/>`,
  ),
  'miku-cushion': svg(
    `<ellipse cx="150" cy="265" rx="116" ry="19" fill="#517068" opacity=".17"/><path d="M50 126Q30 76 55 61L115 80M185 79L244 59Q273 81 250 130" fill="#83c8ba" stroke="#63a898" stroke-width="5"/><rect x="50" y="72" width="200" height="186" rx="65" fill="#d3e7d7" stroke="#a9c5b2" stroke-width="5"/><path d="M57 152Q41 82 140 80Q231 63 247 152L210 124L192 107L172 141L138 116L106 145L90 117Z" fill="#6eb7a9"/><path d="M97 172Q106 160 115 172M182 172Q191 160 200 172" stroke="#3d675e" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M138 201Q150 213 164 200" stroke="#a27568" stroke-width="5" fill="none"/><ellipse cx="88" cy="191" rx="14" ry="8" fill="#e1b5a4"/><ellipse cx="212" cy="191" rx="14" ry="8" fill="#e1b5a4"/>`,
  ),
  'miku-desk-mat': svg(
    `<ellipse cx="150" cy="159" rx="143" ry="81" fill="#8aaf9e" opacity=".24"/><ellipse cx="150" cy="145" rx="141" ry="82" fill="#86b9a7" stroke="#577d70" stroke-width="3"/><ellipse cx="150" cy="145" rx="125" ry="67" fill="none" stroke="#dbe1c6" stroke-width="3" stroke-dasharray="3 5"/><text x="149" y="159" text-anchor="middle" font-family="sans-serif" font-size="53" font-weight="700" fill="#e4ebd3">01</text><text x="149" y="185" text-anchor="middle" font-family="sans-serif" font-size="11" letter-spacing="6" fill="#e4ebd3">MIKU</text>`,
    300,
    250,
  ),
} as const;

export const STUDIO_BACKGROUND = svg(
  `<defs><linearGradient id="wall" x2="0" y2="1"><stop stop-color="#f6f0e4"/><stop offset="1" stop-color="#dfd8c9"/></linearGradient><linearGradient id="floor" x2="0" y2="1"><stop stop-color="#d2b993"/><stop offset="1" stop-color="#e7d4b5"/></linearGradient><linearGradient id="glass" x2="0" y2="1"><stop stop-color="#c9ddcf"/><stop offset="1" stop-color="#edf0d8"/></linearGradient></defs><path d="M0 0H1500V450H0Z" fill="url(#wall)"/><path d="M0 450H1500V1000H0Z" fill="url(#floor)"/><g stroke="#bfa784" stroke-width="2" opacity=".65">${[480, 535, 605, 695, 815, 980].map((y) => `<path d="M0 ${y}H1500"/>`).join('')}${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 150} 450L${(i - 5) * 290 + 750} 1000"/>`).join('')}</g><rect y="425" width="1500" height="28" fill="#b9b69d"/><rect y="429" width="1500" height="11" fill="#f9f4e7"/><rect y="12" width="1500" height="13" fill="#fcf7ed"/><g fill="none" stroke="#d4cbb7" stroke-width="3"><rect x="417" y="74" width="267" height="307" rx="2"/><rect x="716" y="74" width="267" height="307" rx="2"/><rect x="1015" y="74" width="367" height="307" rx="2"/></g><rect x="99" y="28" width="257" height="278" rx="106" fill="#b7b99f"/><rect x="111" y="39" width="233" height="254" rx="97" fill="url(#glass)"/><path d="M112 184H345M227 43V295" stroke="#f5eee0" stroke-width="10"/><path d="M95 296H361V313H95Z" fill="#f5eee0"/><path d="M95 302H362L455 698H168Z" fill="#fff9dc" opacity=".16"/><path d="M61 31Q109 143 79 315M389 31Q337 143 367 315" fill="none" stroke="#e8deca" stroke-width="45"/><path d="M48 21H406" stroke="#927859" stroke-width="9"/>`,
  1500,
  1000,
);
