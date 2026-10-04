import React, { useEffect, useRef, useState } from "react";

interface MatrixRainProps {
  opacity?: number;
  speed?: number;
  fontSize?: number;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({
  opacity = 0.15,
  speed = 33,
  fontSize = 14,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!isEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTick = 0;

    // Mixed character set: Katakana, Matrix glyphs, hex, binary, and math symbols
    const chars =
      "0101010101ABCDEF0123456789" +
      "ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ" +
      "λπΣ⚡💎≠≈∞∆∇{}[]<>/*$#%";

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let columns = Math.floor(width / fontSize);
    let drops: number[] = [];

    const initDrops = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        // Randomize initial vertical position for natural feel
        drops[i] = Math.floor(Math.random() * -50);
      }
    };

    initDrops();

    const handleResize = () => {
      initDrops();
    };

    window.addEventListener("resize", handleResize);

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      // Throttle to target FPS (~30 fps) for maximum battery and CPU efficiency
      if (currentTime - lastTick < speed) return;
      lastTick = currentTime;

      // Fading background trailing effect
      // Use translucent dark color so old characters fade into deep darkness
      ctx.fillStyle = "rgba(2, 5, 4, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading character has brighter head (glowing white / light emerald),
        // trailing characters fade to matrix green
        const isHead = Math.random() > 0.88;
        if (isHead) {
          ctx.fillStyle = "#a7f3d0"; // bright emerald-200 / white-green
          ctx.shadowColor = "#34d399";
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = "#10b981"; // classic emerald matrix
          ctx.shadowBlur = 0;
        }

        ctx.fillText(char, x, y);

        // Reset drop to top once it passes screen bottom
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isEnabled, speed, fontSize]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-0 transition-opacity duration-1000"
      style={{
        opacity: opacity,
        mixBlendMode: "screen",
      }}
    />
  );
};
