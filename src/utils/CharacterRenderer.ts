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

/** Character accessories/hats */
const CHAR_HATS: Record<string, string> = {
  rosie: '🌹', lyra: '✨', koji: '🍳', mizu: '🐚', nyx: '🔮',
  mochi: '🎀', suki: '🌸', ren: '🍁', kira: '🌟', vivi: '🧁',
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
      const hat = CHAR_HATS[id] || '🌸';
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

      // Hat/accessory emoji on top
      const hatSize = size * 0.32;
      ctx.font = `${hatSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hat, cx, cy - r - hatSize * 0.15);

      scene.textures.addCanvas(key, canvas);
    }
  }
}
