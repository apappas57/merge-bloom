import { s } from './constants';

/** Character color themes */
const CHAR_COLORS: Record<string, { body: string; cheek: string; accent: string }> = {
  rosie:  { body: '#FFB3C6', cheek: '#FF6B8A', accent: '#FF4D7A' },
  lyra:   { body: '#D8B4FE', cheek: '#C084FC', accent: '#A855F7' },
  koji:   { body: '#FED7AA', cheek: '#FB923C', accent: '#EA580C' },
  mizu:   { body: '#A5F3FC', cheek: '#67E8F9', accent: '#06B6D4' },
  nyx:    { body: '#C4B5FD', cheek: '#A78BFA', accent: '#7C3AED' },
  mochi:  { body: '#BBF7D0', cheek: '#86EFAC', accent: '#22C55E' },
  suki:   { body: '#FBCFE8', cheek: '#F9A8D4', accent: '#EC4899' },
  ren:    { body: '#FDE68A', cheek: '#FCD34D', accent: '#F59E0B' },
  kira:   { body: '#FEF08A', cheek: '#FDE047', accent: '#EAB308' },
  vivi:   { body: '#FECACA', cheek: '#FCA5A5', accent: '#EF4444' },
};

/**
 * Generate cute kawaii character portrait textures.
 * Each character is a round face with eyes, blush, and a unique hat/accessory.
 */
export class CharacterRenderer {
  static generateTextures(scene: Phaser.Scene, characterIds: string[], size: number): void {
    for (const id of characterIds) {
      const key = `char_${id}`;
      if (scene.textures.exists(key)) continue;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const colors = CHAR_COLORS[id] || CHAR_COLORS.rosie;
      const cx = size / 2;
      const cy = size / 2 + size * 0.05;
      const r = size * 0.38;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.arc(cx + size * 0.02, cy + size * 0.04, r, 0, Math.PI * 2);
      ctx.fill();

      // Body circle
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, colors.body);
      grad.addColorStop(1, colors.accent + '40');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = colors.accent + '60';
      ctx.lineWidth = size * 0.02;
      ctx.stroke();

      // Eyes — big, cute, slightly oval
      const eyeY = cy - r * 0.1;
      const eyeSpacing = r * 0.35;
      const eyeR = r * 0.12;

      // Eye whites
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing, eyeY, eyeR * 1.2, eyeR * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + eyeSpacing, eyeY, eyeR * 1.2, eyeR * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#3D2B1F';
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing + eyeR * 0.1, eyeY + eyeR * 0.1, eyeR * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing + eyeR * 0.1, eyeY + eyeR * 0.1, eyeR * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing - eyeR * 0.2, eyeY - eyeR * 0.3, eyeR * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing - eyeR * 0.2, eyeY - eyeR * 0.3, eyeR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Blush marks
      ctx.fillStyle = colors.cheek + '50';
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing - r * 0.15, eyeY + r * 0.3, r * 0.18, r * 0.1, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + eyeSpacing + r * 0.15, eyeY + r * 0.3, r * 0.18, r * 0.1, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#5C3D2E';
      ctx.lineWidth = size * 0.02;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, eyeY + r * 0.35, r * 0.15, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Hat/accessory drawn as canvas icons (no emoji text)
      const hatSize = size * 0.28;
      const hatX = cx;
      const hatY = cy - r - hatSize * 0.1;
      CharacterRenderer.drawHat(ctx, id, hatX, hatY, hatSize, colors.accent);

      scene.textures.addCanvas(key, canvas);
    }
  }

  /** Draw a canvas-rendered hat/accessory for each character */
  private static drawHat(ctx: CanvasRenderingContext2D, charId: string, cx: number, cy: number, size: number, accent: string): void {
    const r = size * 0.5;
    switch (charId) {
      case 'rosie': {
        // Rose -- red petals with center
        const petalGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        petalGrad.addColorStop(0, '#FF5252');
        petalGrad.addColorStop(1, '#C62828');
        ctx.fillStyle = petalGrad;
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(angle) * r * 0.3, cy + Math.sin(angle) * r * 0.3, r * 0.35, r * 0.25, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'lyra': {
        // Sparkle star
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.9);
        ctx.quadraticCurveTo(cx + r * 0.12, cy - r * 0.12, cx + r * 0.9, cy);
        ctx.quadraticCurveTo(cx + r * 0.12, cy + r * 0.12, cx, cy + r * 0.9);
        ctx.quadraticCurveTo(cx - r * 0.12, cy + r * 0.12, cx - r * 0.9, cy);
        ctx.quadraticCurveTo(cx - r * 0.12, cy - r * 0.12, cx, cy - r * 0.9);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.1, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'koji': {
        // Frying pan with egg
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#424242';
        ctx.fillRect(cx + r * 0.5, cy - r * 0.08, r * 0.5, r * 0.16);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.05, cy, r * 0.35, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(cx - r * 0.05, cy, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'mizu': {
        // Seashell -- spiral shell shape
        const shellGrad = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, 0, cx, cy, r * 0.6);
        shellGrad.addColorStop(0, '#FFFFFF');
        shellGrad.addColorStop(0.4, '#F8BBD0');
        shellGrad.addColorStop(1, '#FFAB91');
        ctx.fillStyle = shellGrad;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.05, cy + r * 0.5);
        ctx.bezierCurveTo(cx - r * 0.6, cy + r * 0.3, cx - r * 0.65, cy - r * 0.2, cx - r * 0.3, cy - r * 0.5);
        ctx.bezierCurveTo(cx, cy - r * 0.65, cx + r * 0.35, cy - r * 0.5, cx + r * 0.5, cy - r * 0.1);
        ctx.bezierCurveTo(cx + r * 0.6, cy + r * 0.15, cx + r * 0.4, cy + r * 0.5, cx - r * 0.05, cy + r * 0.5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = size * 0.03;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.2, Math.PI * 0.5, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'nyx': {
        // Crystal ball -- purple glass sphere
        const crystGrad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, 0, cx, cy, r * 0.55);
        crystGrad.addColorStop(0, '#E1BEE7');
        crystGrad.addColorStop(0.4, '#9C27B0');
        crystGrad.addColorStop(1, '#4A148C');
        ctx.fillStyle = crystGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.12, cy - r * 0.15, r * 0.12, r * 0.08, -0.4, 0, Math.PI * 2);
        ctx.fill();
        // Base
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.5, r * 0.3, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'mochi': {
        // Hair bow -- two loops with center knot
        ctx.fillStyle = '#EC407A';
        [-1, 1].forEach(dir => {
          ctx.beginPath();
          ctx.ellipse(cx + dir * r * 0.4, cy, r * 0.35, r * 0.25, dir * 0.2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#D81B60';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        // Ribbon tails
        ctx.fillStyle = '#EC407A';
        [-1, 1].forEach(dir => {
          ctx.beginPath();
          ctx.moveTo(cx + dir * r * 0.05, cy + r * 0.1);
          ctx.lineTo(cx + dir * r * 0.2, cy + r * 0.6);
          ctx.lineTo(cx + dir * r * 0.35, cy + r * 0.5);
          ctx.closePath();
          ctx.fill();
        });
        break;
      }
      case 'suki': {
        // Cherry blossom -- 5 pink petals
        const blossomGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.6);
        blossomGrad.addColorStop(0, '#FFFFFF');
        blossomGrad.addColorStop(0.5, '#F8BBD0');
        blossomGrad.addColorStop(1, '#F06292');
        ctx.fillStyle = blossomGrad;
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(angle) * r * 0.25, cy + Math.sin(angle) * r * 0.25, r * 0.3, r * 0.18, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'ren': {
        // Maple leaf -- autumnal orange-red
        ctx.fillStyle = '#FF6D00';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.7);
        ctx.lineTo(cx + r * 0.15, cy - r * 0.25);
        ctx.lineTo(cx + r * 0.6, cy - r * 0.35);
        ctx.lineTo(cx + r * 0.3, cy + r * 0.05);
        ctx.lineTo(cx + r * 0.5, cy + r * 0.5);
        ctx.lineTo(cx + r * 0.1, cy + r * 0.3);
        ctx.lineTo(cx, cy + r * 0.6);
        ctx.lineTo(cx - r * 0.1, cy + r * 0.3);
        ctx.lineTo(cx - r * 0.5, cy + r * 0.5);
        ctx.lineTo(cx - r * 0.3, cy + r * 0.05);
        ctx.lineTo(cx - r * 0.6, cy - r * 0.35);
        ctx.lineTo(cx - r * 0.15, cy - r * 0.25);
        ctx.closePath();
        ctx.fill();
        // Vein
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = size * 0.025;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.5);
        ctx.lineTo(cx, cy + r * 0.4);
        ctx.stroke();
        break;
      }
      case 'kira': {
        // Glowing star -- warm gold
        const starGrad = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, 0, cx, cy, r * 0.7);
        starGrad.addColorStop(0, '#FFFFFF');
        starGrad.addColorStop(0.3, '#FFF9C4');
        starGrad.addColorStop(0.7, '#FFD700');
        starGrad.addColorStop(1, '#FFA000');
        ctx.fillStyle = starGrad;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = -Math.PI / 2 + (i * Math.PI) / 5;
          const rad = i % 2 === 0 ? r * 0.7 : r * 0.3;
          const x = cx + Math.cos(angle) * rad;
          const y = cy + Math.sin(angle) * rad;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'vivi': {
        // Cupcake -- base + frosting + cherry
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.35, cy);
        ctx.lineTo(cx + r * 0.35, cy);
        ctx.lineTo(cx + r * 0.25, cy + r * 0.5);
        ctx.lineTo(cx - r * 0.25, cy + r * 0.5);
        ctx.closePath();
        ctx.fill();
        // Liner lines
        ctx.strokeStyle = 'rgba(139,69,19,0.2)';
        ctx.lineWidth = size * 0.015;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * r * 0.12, cy);
          ctx.lineTo(cx + i * r * 0.1, cy + r * 0.5);
          ctx.stroke();
        }
        // Frosting swirl
        const frostGrad = ctx.createRadialGradient(cx, cy - r * 0.15, 0, cx, cy - r * 0.1, r * 0.4);
        frostGrad.addColorStop(0, '#FFFFFF');
        frostGrad.addColorStop(0.5, '#F8BBD0');
        frostGrad.addColorStop(1, '#F06292');
        ctx.fillStyle = frostGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.05, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.25, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Cherry
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.45, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.03, cy - r * 0.48, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default: {
        // Fallback: simple flower
        ctx.fillStyle = accent;
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(angle) * r * 0.25, cy + Math.sin(angle) * r * 0.25, r * 0.25, r * 0.15, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }
}
