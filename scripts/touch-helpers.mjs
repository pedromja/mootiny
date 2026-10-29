// Toques multi-dedo reais (TouchEvent DOM com changedTouches/touches corretos), como num telemóvel.
export function makeTouch(page) {
  const held = new Map();
  const fire = (type, changed) => page.evaluate(({ type, changed, all }) => {
    const target = document.querySelector('#game canvas');
    const mk = (p) => new Touch({ identifier: p.id, target, clientX: p.x, clientY: p.y, pageX: p.x, pageY: p.y, radiusX: 8, radiusY: 8, force: 1 });
    const ev = new TouchEvent(type, { bubbles: true, cancelable: true, composed: true,
      changedTouches: changed.map(mk), touches: all.map(mk), targetTouches: all.map(mk) });
    target.dispatchEvent(ev);
  }, { type, changed, all: [...held.entries()].map(([id, [x, y]]) => ({ id, x, y })) });
  return {
    async down(id, x, y) { held.set(id, [x, y]); await fire('touchstart', [{ id, x, y }]); },
    async up(id) { const p = held.get(id); if (!p) return; held.delete(id); await fire('touchend', [{ id, x: p[0], y: p[1] }]); },
    async tap(x, y, id = 9, ms = 70) { await this.down(id, x, y); await new Promise((r) => setTimeout(r, ms)); await this.up(id); },
    async releaseAll() { for (const id of [...held.keys()]) await this.up(id); },
  };
}
