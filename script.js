
    // === CONTACT SAVE ===
    function saveContact() {
      const link = document.createElement("a");
      link.href = "abhi_contact.vcf"; // ensure file exists in same folder
      link.download = "AbhiRam_Contact.vcf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // === OPEN LINK IN NEW TAB ===
    function openLink(url) {
      window.open(url, "_blank");
    }

    // === THEME TOGGLE ===
    function toggleTheme() {
      document.body.classList.toggle("light-theme");
    }

    // === VOICE INTRO ===
    function playIntro() {
      const audio = document.getElementById("intro-audio");
      if (!audio) return;
      audio
        .play()
        .then(() => {
          console.log("Intro playing");
        })
        .catch((err) => {
          console.log("Playback blocked (requires user gesture).", err);
        });
    }

    // === DYNAMIC STATUS (rotating availability text) ===
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

    // === AR + Marker Events (MindAR) ===
    function setupMarkerEvents() {
      const targetEntity = document.getElementById("marker-target");
      const overlay = document.getElementById("ui-overlay");
      const pill = document.getElementById("marker-status-pill");
      const hint = document.getElementById("scan-hint");
      const arStatusText = document.getElementById("ar-status-text");
      const arStatusDot = document.getElementById("ar-status-dot");

      if (!targetEntity || !overlay) return;

      // Initial AR status
      if (arStatusText) arStatusText.textContent = "Scanning for marker...";
      if (arStatusDot) arStatusDot.style.background = "#f59e0b"; // amber

      targetEntity.addEventListener("targetFound", () => {
        overlay.classList.add("visible");
        if (pill) pill.textContent = "Marker detected";
        if (hint) {
          hint.textContent = "Marker locked. Interact with your card below.";
        }
        if (arStatusText) arStatusText.textContent = "Marker detected";
        if (arStatusDot) arStatusDot.style.background = "#22c55e"; // green
      });

      targetEntity.addEventListener("targetLost", () => {
        overlay.classList.remove("visible");
        if (pill) pill.textContent = "Scanning...";
        if (hint) {
          hint.textContent = "Point your camera at the printed AR business card to activate.";
        }
        if (arStatusText) arStatusText.textContent = "Marker lost · scanning...";
        if (arStatusDot) arStatusDot.style.background = "#f59e0b"; // amber
      });

      // Scene error handling
      const sceneEl = document.querySelector("a-scene");
      if (sceneEl) {
        sceneEl.addEventListener("arError", () => {
          if (arStatusText) {
            arStatusText.textContent = "AR error · check camera permission";
          }
          if (arStatusDot) arStatusDot.style.background = "#ef4444"; // red
        });
      }
    }

    // === CARD TILT EFFECT (on pointer move) ===
    function setupCardTilt() {
      const overlay = document.getElementById("ui-overlay");
      const card = document.getElementById("glass-card");
      if (!overlay || !card) return;

      const maxRotateX = 10; // deg
      const maxRotateY = 14; // deg

      function handleMove(e) {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const rotateY = x * maxRotateY;     // left/right
        const rotateX = -y * maxRotateX;   // up/down

        card.style.transform =
          `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      }

      function resetTilt() {
        card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
      }

      overlay.addEventListener("pointermove", handleMove);
      overlay.addEventListener("pointerleave", resetTilt);
      overlay.addEventListener("pointercancel", resetTilt);
    }

    // === NEW: MAKE HTML OVERLAY FOLLOW THE MARKER ON SCREEN ===
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

          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          overlay.style.left = `${x}px`;
          overlay.style.top = `${y}px`;
        }
        requestAnimationFrame(updateOverlayPosition);
      }

      requestAnimationFrame(updateOverlayPosition);
    }

    // === NEW: MAKE CARD SHAKE WHEN PHONE SHAKES ===
    function setupShake() {
      if (!window.DeviceMotionEvent) {
        console.log("DeviceMotionEvent not supported on this device.");
        return;
      }

      const card = document.getElementById("glass-card");
      if (!card) return;

      let lastX = null, lastY = null, lastZ = null;
      let lastTime = 0;
      const threshold = 18; // tweak if needed
      const minGap = 700;   // ms between shakes

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

            // Small shake animation (overrides tilt briefly, which is fine)
            card.animate(
              [
                { transform: "translate3d(0,0,0) rotateZ(0deg)" },
                { transform: "translate3d(-2px,1px,0) rotateZ(-0.8deg)" },
                { transform: "translate3d(2px,-1px,0) rotateZ(0.8deg)" },
                { transform: "translate3d(-1px,1px,0) rotateZ(-0.4deg)" },
                { transform: "translate3d(0,0,0) rotateZ(0deg)" }
              ],
              { duration: 300, easing: "ease-out" }
            );
          }
        }

        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      // Rotate “availability” text every 5 seconds
      rotateStatus();
      setInterval(rotateStatus, 5000);

      // Attach marker events after A-Frame scene is loaded
      const sceneEl = document.querySelector("a-scene");
      if (sceneEl) {
        sceneEl.addEventListener("loaded", () => {
          const arStatusText = document.getElementById("ar-status-text");
          if (arStatusText) arStatusText.textContent = "AR ready · scanning for marker...";

          setupMarkerEvents();
          setupCardTilt();
          startOverlayTracking(); // <== overlay follows marker
          setupShake();           // <== card responds to phone shake
        });
      }
    });
  