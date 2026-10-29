import sharp from 'sharp';
const face = (s) => `<g transform="translate(256 262) scale(${s}) translate(-256 -270)">
 <path d="M160 150 L118 52 L205 128 Z" fill="#E8D8A8" stroke="#1C1410" stroke-width="12" stroke-linejoin="round"/>
 <path d="M352 150 L394 52 L307 128 Z" fill="#E8D8A8" stroke="#1C1410" stroke-width="12" stroke-linejoin="round"/>
 <ellipse cx="110" cy="205" rx="62" ry="32" fill="#F2A7B5" stroke="#1C1410" stroke-width="12"/>
 <ellipse cx="402" cy="205" rx="62" ry="32" fill="#F2A7B5" stroke="#1C1410" stroke-width="12"/>
 <rect x="130" y="108" width="252" height="296" rx="112" fill="#FFFFFF" stroke="#1C1410" stroke-width="14"/>
 <path d="M296 116 C 352 112 378 150 376 205 C 330 214 296 180 296 116 Z" fill="#1C1410"/>
 <circle cx="205" cy="228" r="36" fill="#fff" stroke="#1C1410" stroke-width="9"/><circle cx="212" cy="232" r="18" fill="#1C1410"/><circle cx="219" cy="224" r="6" fill="#fff"/>
 <circle cx="307" cy="228" r="36" fill="#fff" stroke="#1C1410" stroke-width="9"/><circle cx="314" cy="232" r="18" fill="#1C1410"/><circle cx="321" cy="224" r="6" fill="#fff"/>
 <rect x="160" y="290" width="192" height="108" rx="54" fill="#F2A7B5" stroke="#1C1410" stroke-width="12"/>
 <ellipse cx="216" cy="344" rx="14" ry="19" fill="#9C4A5A"/><ellipse cx="296" cy="344" rx="14" ry="19" fill="#9C4A5A"/>
 <path d="M138 404 L374 404 L256 486 Z" fill="#FF3B30" stroke="#1C1410" stroke-width="12" stroke-linejoin="round"/>
</g>`;
const svg = (s) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#C4452D"/>${face(s)}</svg>`);
await sharp(svg(0.98)).png().toFile('public/icon-512.png');
await sharp(svg(0.98)).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(svg(0.98)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(svg(0.7)).png().toFile('public/icon-maskable-512.png');
await sharp(svg(0.98)).resize(48, 48).png().toFile('public/favicon.png');
console.log('icons ok');
