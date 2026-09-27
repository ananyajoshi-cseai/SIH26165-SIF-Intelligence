import React, { useRef, useState } from "react";

export default function FlipCard({
  front,
  back,
  axis = "y",
  flipOnClick = true,
  draggable = false,
  dragDistance = 8,
  tilt = false,
  tiltMax = 12,
  glare = false,
  glareOpacity = 0.22,
  hoverScale = 1.03,
  perspective = 1100,
  stiffness = 170,
  damping = 20,
  width = 300,
  height = 400,
  radius = 8,
  background = "#15171a",
  color = "#f5f5f5",
  shadow = true,
  shadowColor = "#000000",
  shadowOpacity = 0.45,
  ariaLabel = "Timeline card",
  onSelect,
  onFlipChange,
}) {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const pointerStart = useRef(null);
  const moved = useRef(false);
  const ignoreClick = useRef(false);
  const axisName = axis === "x" ? "X" : "Y";
  const transitionDuration = Math.max(280, Math.min(620, Math.round(560 * (170 / Math.max(stiffness, 1)) + damping * 2)));
  const cardShadow = shadow ? `0 24px 60px ${shadowColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, "0")}` : "none";

  const flip = () => {
    if (!flipOnClick) return;
    const next = !flipped;
    setFlipped(next);
    onFlipChange?.(next);
  };

  const updatePointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    setRotation(tilt ? { x: (0.5 - y) * tiltMax * 2, y: (x - 0.5) * tiltMax * 2 } : { x: 0, y: 0 });
    setGlarePosition({ x: x * 100, y: y * 100 });
    if (draggable && pointerStart.current) {
      const deltaX = event.clientX - pointerStart.current.x;
      const deltaY = event.clientY - pointerStart.current.y;
      if (Math.hypot(deltaX, deltaY) > dragDistance) moved.current = true;
      if (moved.current) {
        setDragging(true);
        setOffset({ x: pointerStart.current.offsetX + deltaX, y: pointerStart.current.offsetY + deltaY });
      }
    }
  };

  const handlePointerDown = (event) => {
    if (!draggable || event.button !== 0) return;
    pointerStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
    moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event) => {
    if (!pointerStart.current) return;
    ignoreClick.current = moved.current;
    pointerStart.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className={`flip-card-shell ${hovered ? "is-hovered" : ""} ${dragging ? "is-dragging" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${ariaLabel}: ${flipped ? "show image" : "show details"}`}
      onClick={() => {
        if (ignoreClick.current) {
          ignoreClick.current = false;
          return;
        }
        onSelect?.();
        flip();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
          flip();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={updatePointer}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setDragging(false);
        setRotation({ x: 0, y: 0 });
        if (!pointerStart.current) setOffset({ x: 0, y: 0 });
      }}
      style={{
        width: `min(${typeof width === "number" ? `${width}px` : width}, 100%)`,
        height: typeof height === "number" ? `${height}px` : height,
        perspective: `${perspective}px`,
        color,
        borderRadius: `${radius}px`,
        background,
        boxShadow: cardShadow,
        cursor: flipOnClick ? "pointer" : draggable ? "grab" : "default",
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${hovered && !dragging ? hoverScale : 1})`,
        transition: dragging ? "none" : `transform ${transitionDuration}ms cubic-bezier(.2,.8,.2,1), box-shadow 300ms ease`,
        touchAction: draggable ? "none" : "manipulation",
      }}
    >
      <div
        className="flip-card-inner"
        style={{
          transform: `rotate${axisName}(${flipped ? 180 : 0}deg) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: dragging ? "none" : `transform ${transitionDuration}ms cubic-bezier(.2,.8,.2,1)`,
          borderRadius: `${radius}px`,
        }}
      >
        <div className="flip-card-face flip-card-front" style={{ borderRadius: `${radius}px`, background }}>
          {front}
          {glare && <span className="flip-card-glare" style={{ opacity: hovered ? glareOpacity : 0, background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,.7), transparent 48%)` }} />}
        </div>
        <div
          className="flip-card-face flip-card-back"
          style={{ borderRadius: `${radius}px`, background, transform: `rotate${axisName}(180deg)` }}
        >
          {back}
          {glare && <span className="flip-card-glare" style={{ opacity: hovered ? glareOpacity : 0, background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,.7), transparent 48%)` }} />}
        </div>
      </div>
    </div>
  );
}
