// src/scroll/ScrollDebug.jsx
// Live HUD for tuning scroll. Enable with <ScrollStage debug /> or `?scrolldebug` on any project URL.
import React, { useEffect, useState } from 'react';
import { useStage } from './context.js';

const fmt = (n) => (Number.isFinite(n) ? n.toFixed(3) : '–');

export default function ScrollDebug() {
  const { engine } = useStage();
  const [info, setInfo] = useState(null);

  useEffect(() => (engine ? engine.subscribeFrame(setInfo) : undefined), [engine]);
  if (!info) return null;

  return (
    <pre className="scroll-debug" aria-hidden="true">
      {`section  ${info.activeId}
pos      ${fmt(info.s)} / ${fmt(info.total)} screens
raw      ${fmt(info.raw)}
gate     [${fmt(info.window[0])}, ${fmt(info.window[1])}]
settled  ${fmt(info.settledS)}
state    ${info.animating ? 'snapping' : info.pendingSettle ? 'gesture' : 'idle'}${info.transitioning ? ' · transition' : ''}`}
    </pre>
  );
}
