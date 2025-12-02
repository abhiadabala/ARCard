
    // === OPEN LINK IN NEW TAB ===
    function openLink(url) {
      window.open(url, "_blank");
    }

    // === THEME TOGGLE ===
    function toggleTheme() {
      document.body.classList.toggle("light-theme");
    }

    // === VOICE INTRO ===
    const introAudio = document.getElementById("intro-audio");
    let introPlayed = false;

    function playIntro() {
      if (!introAudio) return;
      introAudio
        .play()
        .then(() => {
          console.log("Intro playing");
        })
        .catch((err) => {
          console.log("Intro play blocked, will try again on next gesture.", err);
        });
    }

    function autoPlayIntroOnce() {
      if (introPlayed) return;
      introPlayed = true;
      playIntro();
    }

    // === DRAG-TO-ROTATE CARD ===
    function setupDragRotate() {
      const card = document.getElementById("glass-card");
      if (!card) return;

      let isDragging = false;
      let lastX = 0;
      let lastY = 0;
      let rotX = -5;
      let rotY = 0;

      applyTransforms();

      function applyTransforms() {
        const clampedX = Math.max(-45, Math.min(45, rotX));
        card.style.transform =
          `rotateX(${clampedX}deg) rotateY(${rotY}deg) translateY(-2px)`;
      }

      function onPointerDown(e) {
        const tag = e.target.tagName.toLowerCase();
        if (tag === "button" || tag === "a") return; // don't start drag on buttons

        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        autoPlayIntroOnce();
        card.setPointerCapture(e.pointerId);
      }

      function onPointerMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        const sensitivity = 0.35;
        rotY += dx * sensitivity;
        rotX -= dy * sensitivity;

        lastX = e.clientX;
        lastY = e.clientY;

        applyTransforms();
      }

      function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        card.releasePointerCapture(e.pointerId);
      }

      card.addEventListener("pointerdown", onPointerDown);
      card.addEventListener("pointermove", onPointerMove);
      card.addEventListener("pointerup", onPointerUp);
      card.addEventListener("pointercancel", onPointerUp);
      card.addEventListener("pointerleave", () => { isDragging = false; });
    }

    // === FLIP BUTTONS (front & back) ===
    function setupFlipButtons() {
      const card = document.getElementById("glass-card");
      if (!card) return;

      const flipButtons = document.querySelectorAll(".flip-btn");
      flipButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          card.classList.toggle("show-back");
          autoPlayIntroOnce();
        });
      });
    }

    // === DYNAMIC STATUS ===
    const statusList = [
      "✔️ Available for freelance",
      "❗ Actively looking for job opportunities",
      "🌐 Open to remote collaboration"
    ];
    let statusIndex = 0;

    function rotateStatus() {
      const el = document.getElementById("status-text");
      if (!el) return;
      el.textContent = statusList[statusIndex];
      statusIndex = (statusIndex + 1) % statusList.length;
    }

    // === SAVE CONTACT (VCF) ===
    function saveContact() {
      const link = document.createElement("a");
      link.href = "abhi_contact.vcf";
      link.download = "AbhiRam_Contact.vcf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // === AR + Marker Events ===
    function setupMarkerEvents() {
      const targetEntity = document.getElementById("marker-target");
      const overlay = document.getElementById("ui-overlay");
      const hint = document.getElementById("scan-hint");
      const arStatusText = document.getElementById("ar-status-text");
      const arStatusDot = document.getElementById("ar-status-dot");

      if (!targetEntity || !overlay) return;

      if (arStatusText) arStatusText.textContent = "Scanning for marker...";
      if (arStatusDot) arStatusDot.style.background = "#f59e0b";

      targetEntity.addEventListener("targetFound", () => {
        overlay.classList.add("visible");
        if (hint) {
          hint.textContent = "Marker locked. Drag to rotate, use Flip for back side.";
        }
        if (arStatusText) arStatusText.textContent = "Marker detected";
        if (arStatusDot) arStatusDot.style.background = "#22c55e";
        autoPlayIntroOnce();
      });

      targetEntity.addEventListener("targetLost", () => {
        overlay.classList.remove("visible");
        if (hint) {
          hint.textContent = "Point your camera at the printed AR business card to activate.";
        }
        if (arStatusText) arStatusText.textContent = "Marker lost · scanning...";
        if (arStatusDot) arStatusDot.style.background = "#f59e0b";
      });

      const sceneEl = document.querySelector("a-scene");
      if (sceneEl) {
        sceneEl.addEventListener("arError", () => {
          if (arStatusText) {
            arStatusText.textContent = "AR error · check camera permission";
          }
          if (arStatusDot) arStatusDot.style.background = "#ef4444";
        });
      }
    }

    // === OVERLAY FOLLOW MARKER SIDE-BY-SIDE WITH GAP ===
    function startOverlayTracking() {
      const sceneEl = document.querySelector("a-scene");
      const marker = document.getElementById("marker-target");
      const overlay = document.getElementById("ui-overlay");

      if (!sceneEl || !marker || !overlay || !window.THREE) {
        console.log("Tracking setup failed: missing scene/marker/THREE");
        return;
      }

      const vector = new THREE.Vector3();

      function updateOverlayPosition() {
        const camera = sceneEl.camera;
        if (camera && marker.object3D && marker.object3D.visible) {
          marker.object3D.getWorldPosition(vector);
          vector.project(camera);

          const markerX = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const markerY = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          const rect = overlay.getBoundingClientRect();
          const gap = 40;
          const margin = 8;

          // Try placing card to the right of marker
          let left = markerX + gap;
          let top = markerY - rect.height / 2;

          // If off-right, place on left of marker
          if (left + rect.width > window.innerWidth - margin) {
            left = markerX - gap - rect.width;
          }

          left = Math.max(margin, Math.min(window.innerWidth - rect.width - margin, left));
          top = Math.max(margin, Math.min(window.innerHeight - rect.height - margin, top));

          overlay.style.left = `${left}px`;
          overlay.style.top = `${top}px`;
        }

        requestAnimationFrame(updateOverlayPosition);
      }

      requestAnimationFrame(updateOverlayPosition);
    }

    // === SHAKE EFFECT ===
    function setupShake() {
      if (!window.DeviceMotionEvent) {
        console.log("DeviceMotionEvent not supported on this device.");
        return;
      }

      const card = document.getElementById("glass-card");
      if (!card) return;

      let lastX = null, lastY = null, lastZ = null;
      let lastTime = 0;
      const threshold = 18;
      const minGap = 700;

      window.addEventListener("devicemotion", (event) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        const currentTime = Date.now();
        if (lastX !== null) {
          const deltaX = Math.abs(acc.x - lastX);
          const deltaY = Math.abs(acc.y - lastY);
          const deltaZ = Math.abs(acc.z - lastZ);
          const speed = deltaX + deltaY + deltaZ;

          if (speed > threshold && currentTime - lastTime > minGap) {
            lastTime = currentTime;

            card.animate(
              [
                { transform: card.style.transform },
                { transform: card.style.transform + " translate3d(-2px,1px,0) rotateZ(-0.8deg)" },
                { transform: card.style.transform + " translate3d(2px,-1px,0) rotateZ(0.8deg)" },
                { transform: card.style.transform + " translate3d(-1px,1px,0) rotateZ(-0.4deg)" },
                { transform: card.style.transform }
              ],
              { duration: 320, easing: "ease-out" }
            );
          }
        }

        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      rotateStatus();
      setInterval(rotateStatus, 5000);

      setupDragRotate();
      setupFlipButtons();

      const themeToggleBtn = document.getElementById("theme-toggle");
      if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
          toggleTheme();
          autoPlayIntroOnce();
        });
      }
      
      const sceneEl = document.querySelector("a-scene");
      if (sceneEl) {
        sceneEl.addEventListener("loaded", () => {
          const arStatusText = document.getElementById("ar-status-text");
          if (arStatusText) {
            arStatusText.textContent = "AR ready · scanning for marker...";
          }

          setupMarkerEvents();
          startOverlayTracking();  // card follows marker side-by-side
          setupShake();
        });
      }
    });
  