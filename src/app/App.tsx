import { useEffect, useRef } from 'react';
import { parseRuntimeConfig } from '../engine/runtimeConfig';
import { bootstrapGame } from '../engine/bootstrap';
import { HudRoot } from '../ui/HudRoot';

export const App = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const runtimeConfig = parseRuntimeConfig(window.location.search);
    const game = bootstrapGame(canvasRef.current, runtimeConfig);

    return () => {
      game.dispose();
    };
  }, []);

  return (
    <div className="app-shell">
      <canvas ref={canvasRef} id="game-canvas" />
      <HudRoot />
    </div>
  );
};
