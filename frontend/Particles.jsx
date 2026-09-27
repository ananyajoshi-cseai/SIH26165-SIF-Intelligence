import React, { useEffect, useRef } from "react";

export default function Particles({
  particleColors = ["#ffffff"],
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleBaseSize = 100,
  moveParticlesOnHover = true,
  alphaParticles = false,
  disableRotation = false,
  pixelRatio = 1,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = particleColors.length ? particleColors : ["#ffffff"];
    const pointer = { x: -1000, y: -1000 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let particles = [];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, pixelRatio);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const spread = Math.max(0.1, Math.min(2, particleSpread / 10));
      particles = Array.from({ length: particleCount }, () => ({
        x: width * (0.5 + (Math.random() - 0.5) * spread),
        y: height * (0.5 + (Math.random() - 0.5) * spread),
        radius: Math.random() * (particleBaseSize * 0.035) + 0.8,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        angle: Math.random() * Math.PI,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.42 + 0.16,
      }));
    };

    const onPointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
    };
    const onPointerLeave = () => { pointer.x = -1000; pointer.y = -1000; };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        if (!reducedMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (moveParticlesOnHover) {
            const dx = particle.x - pointer.x;
            const dy = particle.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0 && distance < 130) {
              const force = (130 - distance) / 1300;
              particle.x += (dx / distance) * force;
              particle.y += (dy / distance) * force;
            }
          }
          if (particle.x < -8) particle.x = width + 8;
          if (particle.x > width + 8) particle.x = -8;
          if (particle.y < -8) particle.y = height + 8;
          if (particle.y > height + 8) particle.y = -8;
          if (!disableRotation) particle.angle += 0.001;
        }
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(disableRotation ? 0 : particle.angle);
        context.globalAlpha = alphaParticles ? particle.alpha : Math.min(0.68, particle.alpha + 0.16);
        context.fillStyle = particle.color;
        context.beginPath();
        context.ellipse(0, 0, particle.radius, disableRotation ? particle.radius : Math.max(0.7, particle.radius * 0.28), 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });
      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [alphaParticles, disableRotation, moveParticlesOnHover, particleBaseSize, particleColors, particleCount, particleSpread, pixelRatio, speed]);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}
