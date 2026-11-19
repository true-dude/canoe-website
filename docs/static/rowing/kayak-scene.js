"use strict";

(() => {
  const canvas = document.querySelector("[data-kayak-scene]");
  const context = canvas?.getContext("2d");
  if (!context) return;

  const section = canvas.closest(".image-statement");
  const playback = section.querySelector("[data-kayak-playback]");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const extents = { width: 0, height: 0, ratio: 1 };
  const initialPose = 0.18;
  const cycle = 2.2;
  const tau = Math.PI * 2;

  // Small, fixed variations in the reflections stay in the same place on every frame.
  const reflections = Array.from({ length: 160 }, (_, index) => ({
    x: (index * 0.61803399) % 1,
    y: (index * 0.75487767) % 1,
    length: 2 + ((index * 13) % 28),
    opacity: 0.035 + ((index * 7) % 11) * 0.008,
  }));

  function line(points, color, width) {
    context.beginPath();
    context.moveTo(...points[0]);
    for (const point of points.slice(1)) context.lineTo(...point);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.stroke();
  }

  function ellipse(x, y, radiusX, radiusY, color, angle = 0) {
    context.beginPath();
    context.ellipse(x, y, radiusX, radiusY, angle, 0, tau);
    context.fillStyle = color;
    context.fill();
  }

  function paintWater(time) {
    const { width, height } = extents;
    context.lineWidth = 1;
    for (const ripple of reflections) {
      const x = width * ripple.x;
      const y = height * ripple.y;
      const shimmer = Math.sin(ripple.x * 30 + time * 2 + ripple.y * 16);
      context.strokeStyle = `rgba(133, 213, 196, ${ripple.opacity * (0.77 + 0.23 * shimmer)})`;
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(x + ripple.length * 0.57, y - 2, x + ripple.length, y - 0.6);
      context.stroke();
    }
  }

  function paddlePose(time) {
    const phase = time / cycle * tau;
    const angle = -Math.cos(phase) * 0.63;
    const pivotX = Math.sin(phase) * 7;
    const pivotY = -22 + 6 * Math.sin(phase) ** 2;
    return {
      angle,
      side: Math.sin(phase) >= 0 ? 1 : -1,
      force: Math.abs(Math.sin(phase)),
      at(distance) {
        return [pivotX + distance * Math.cos(angle), pivotY + distance * Math.sin(angle)];
      },
    };
  }

  function paintWake(time) {
    for (const side of [-1, 1]) {
      for (let ridge = 0; ridge < 4; ridge += 1) {
        const spread = side * (8 + ridge * 5);
        const drift = side * (5 + ridge * 2) * Math.sin(time * 2 + ridge);
        const tail = 241 + ridge * 13;
        const foam = context.createLinearGradient(0, -118, 0, tail);
        foam.addColorStop(0, "rgba(141, 224, 207, 0)");
        foam.addColorStop(0.42, `rgba(141, 224, 207, ${0.2 - ridge * 0.028})`);
        foam.addColorStop(0.85, "rgba(141, 224, 207, 0.17)");
        foam.addColorStop(1, "rgba(141, 224, 207, 0)");

        context.beginPath();
        context.moveTo(side * 3, -143 + ridge * 19);
        context.bezierCurveTo(spread * 2.9, -86, spread * 0.5, 105, spread, 163);
        context.quadraticCurveTo(spread * 1.55 + drift, 208, spread * 2.25 + drift, tail);
        context.strokeStyle = foam;
        context.lineWidth = 1.3;
        context.stroke();
      }
    }

    for (let trail = 1; trail <= 10; trail += 1) {
      const age = trail * 0.062;
      const earlier = paddlePose(time - age);
      if (earlier.force < 0.36) continue;

      const [x, y] = earlier.at(earlier.side * 97);
      const opacity = (1 - age / 0.7) * earlier.force;
      context.beginPath();
      context.ellipse(x, y + age * 28, 3 + age * 20, 8 + age * 22, earlier.angle, -1.2, 2.5);
      context.lineWidth = 1.2;
      context.strokeStyle = `rgba(167, 232, 218, ${opacity * 0.37})`;
      context.stroke();
      for (let drop = 0; drop < 3; drop += 1) {
        const distance = (drop + 2) * age * 8;
        ellipse(x + earlier.side * distance, y + distance * 2, 0.85, 1.4,
          `rgba(203, 246, 230, ${opacity * 0.68})`);
      }
    }
  }

  function paintHull() {
    context.save();
    context.shadowColor = "rgba(2, 15, 20, 0.8)";
    context.shadowBlur = 17;
    context.shadowOffsetX = -6;
    context.shadowOffsetY = 7;
    const deck = context.createLinearGradient(-18, 0, 18, 0);
    deck.addColorStop(0, "#356b64");
    deck.addColorStop(0.21, "#86c2ab");
    deck.addColorStop(0.57, "#c4e2c8");
    deck.addColorStop(0.76, "#98c8b2");
    deck.addColorStop(1, "#387066");
    context.beginPath();
    context.moveTo(0, -190);
    context.bezierCurveTo(8, -170, 17, -74, 17, 4);
    context.bezierCurveTo(17, 82, 8, 161, 0, 185);
    context.bezierCurveTo(-8, 161, -17, 82, -17, 4);
    context.bezierCurveTo(-17, -74, -8, -170, 0, -190);
    context.closePath();
    context.fillStyle = deck;
    context.fill();
    context.restore();

    line([[0, -177], [0, -92], [0, -60]], "rgba(246, 250, 227, 0.7)", 1);
    line([[0, 62], [0, 119], [0, 171]], "rgba(246, 250, 227, 0.53)", 1);
    for (const side of [-1, 1]) {
      line([[side * 5, -150], [side * 9, -102], [side * 11, -65]], "rgba(13, 58, 55, 0.45)", 1);
      line([[side * 11, 58], [side * 8, 113], [side * 4, 151]], "rgba(13, 58, 55, 0.42)", 1);
    }
    ellipse(0, 9, 14.5, 45, "#509187");
    ellipse(0, 9, 12.5, 42, "#0b2d33");
  }

  function paintBlade(pose, side) {
    const [x, y] = pose.at(side * 78);
    const submerged = side === pose.side && pose.force > 0.25;
    context.save();
    context.translate(x, y);
    context.rotate(pose.angle + (side < 0 ? Math.PI : 0));
    context.beginPath();
    context.moveTo(0, -2.4);
    context.bezierCurveTo(10, -8, 26, -7, 34, -5);
    context.quadraticCurveTo(36, 2, 31, 7);
    context.bezierCurveTo(23, 9, 8, 6, 0, 2.4);
    context.closePath();

    const blade = context.createLinearGradient(0, -8, 0, 8);
    blade.addColorStop(0, submerged ? "#a6c9bd" : "#f0f0dc");
    blade.addColorStop(1, submerged ? "#568f84" : "#aac2af");
    context.fillStyle = blade;
    context.fill();
    line([[5, 0], [19, -1.4], [32, -0.5]], submerged ? "#74a69a" : "#e4ead4", 1.1);
    context.restore();
  }

  function paintPaddler(pose) {
    const torsoAngle = pose.angle * 0.29;
    ellipse(-3, 7, 22, 28, "rgba(2, 19, 23, .55)", torsoAngle);
    ellipse(0, 9, 17.5, 25, "#8e482f", torsoAngle);
    ellipse(1, 7, 16.5, 22, "#ce6e46", torsoAngle);
    ellipse(2, 11, 8.5, 14, "#9a462f", torsoAngle);
    line([[-10, 23], [10, 24]], "#6f3728", 2);

    const arms = [-1, 1].map((side) => ({
      shoulder: [side * 14, -5 + side * 9 * Math.sin(torsoAngle)],
      elbow: [side * (26 + pose.force * 3), -1 + side * (pose.angle * 13)],
      hand: pose.at(side * 31),
    }));
    for (const { shoulder, elbow, hand } of arms) {
      line([shoulder, elbow, hand], "#482f22", 8);
      line([shoulder, elbow], "#bd6646", 6.2);
      line([elbow, hand], "#d3956d", 4.8);
    }

    const headX = pose.angle * 4;
    ellipse(headX, -15, 9.1, 11.4, "#95634a", torsoAngle);
    ellipse(headX, -17, 8.8, 10.1, "#18363b", torsoAngle);
    ellipse(headX + 2, -20, 6, 5, "#2e5152", torsoAngle);
    line([[headX - 6, -13], [headX + 3, -12]], "#6a8178", 1);

    line([pose.at(-80), pose.at(80)], "#18353a", 4);
    line([pose.at(-79), pose.at(79)], "#8ab1aa", 1.65);
    paintBlade(pose, -1);
    paintBlade(pose, 1);
    for (const { hand } of arms) ellipse(...hand, 3.4, 3.7, "#dfa687", pose.angle);
  }

  function draw(time) {
    const { width, height, ratio } = extents;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";
    paintWater(time);

    const scale = Math.min(width / 405, height / 357);
    context.save();
    context.translate(width * 0.55, height * 0.45 + 2.5 * Math.sin(time * 3));
    context.scale(scale, scale);
    context.rotate(1.01 + Math.sin(time * 3) * 0.018);
    paintWake(time);
    paintHull();
    paintPaddler(paddlePose(time));
    context.restore();
  }

  let visible = false;
  let paused = false;
  let elapsed = 0;
  let lastFrame = null;
  let animationFrame = 0;

  function frame(now) {
    if (lastFrame !== null) elapsed += (now - lastFrame) / 1000;
    lastFrame = now;
    draw(initialPose + elapsed);
    animationFrame = requestAnimationFrame(frame);
  }

  function syncPlayback() {
    if (visible && !document.hidden && !motion.matches && !paused) {
      if (!animationFrame) animationFrame = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastFrame = null;
    }
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    Object.assign(extents, { width, height, ratio });
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    draw(initialPose + elapsed);
    section.classList.add("has-kayak-scene");
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
    syncPlayback();
  }, { threshold: 0.25 }).observe(section);
  playback.hidden = motion.matches;
  playback.addEventListener("click", () => {
    paused = !paused;
    playback.setAttribute("aria-pressed", String(paused));
    syncPlayback();
  });
  motion.addEventListener("change", () => {
    playback.hidden = motion.matches;
    syncPlayback();
  });
  document.addEventListener("visibilitychange", syncPlayback);
})();
