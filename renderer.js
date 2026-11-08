// Drishti Dangle - Physics & Interaction Engine
document.addEventListener('DOMContentLoaded', async () => {
  const pendulumAnchor = document.getElementById('pendulumAnchor');
  const bommai = document.getElementById('bommai');
  const bommaiImg = document.getElementById('bommaiImg');
  const hangingCord = document.getElementById('hangingCord');
  const topMount = document.getElementById('topMount');
  const contextMenu = document.getElementById('contextMenu');

  // Interactive element list for mouse-ignore handling
  const interactiveElements = [bommai, hangingCord, topMount, contextMenu];

  // Default Settings
  let settings = {
    animationEnabled: true,
    swingIntensity: 1.0,
    animationSpeed: 1.0,
    position: 'center',
    showString: true,
    currentCharm: 'classic'
  };

  function getCharmSvgPath(charm) {
    switch (charm) {
      case 'terracotta': return 'assets/charm-terracotta.svg';
      case 'gold': return 'assets/charm-gold.svg';
      case 'chibi': return 'assets/charm-chibi.svg';
      case 'spiderman': return 'assets/charm-spiderman.svg';
      case 'batman': return 'assets/charm-batman.svg';
      case 'classic':
      default: return 'assets/charm-classic.svg';
    }
  }

  // Load initial settings
  if (window.electronAPI) {
    try {
      const loaded = await window.electronAPI.getSettings();
      if (loaded) {
        settings = { ...settings, ...loaded };
        applySettings();
      }
    } catch (err) {
      console.warn('Could not load settings from IPC:', err);
    }

    // Listen for live updates from settings window or tray
    window.electronAPI.onSettingsUpdate((newSettings) => {
      settings = { ...settings, ...newSettings };
      applySettings();
    });
  }

  function applySettings() {
    if (hangingCord) {
      // Cord theme classes
      hangingCord.className = 'hanging-cord';
      if (settings.currentCharm === 'spiderman') {
        hangingCord.classList.add('web-cord');
      } else if (settings.currentCharm === 'batman') {
        hangingCord.classList.add('bat-cord');
      }

      if (!settings.showString) {
        hangingCord.classList.add('hidden');
      }
    }

    if (bommaiImg) {
      const targetSrc = getCharmSvgPath(settings.currentCharm);
      if (bommaiImg.getAttribute('src') !== targetSrc) {
        bommaiImg.style.transition = 'opacity 0.15s ease';
        bommaiImg.style.opacity = '0.3';
        bommaiImg.src = targetSrc;
        setTimeout(() => {
          bommaiImg.style.opacity = '1';
        }, 80);
      }
    }
  }

  // ==========================================
  // Mouse Pass-Through Management
  // ==========================================
  let isHoveringInteractive = false;
  let isDragging = false;
  let isContextMenuOpen = false;

  function updateMouseEventsPassThrough() {
    if (!window.electronAPI) return;
    if (isHoveringInteractive || isDragging || isContextMenuOpen) {
      window.electronAPI.setIgnoreMouseEvents(false);
    } else {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  interactiveElements.forEach((el) => {
    if (!el) return;
    el.addEventListener('mouseenter', () => {
      isHoveringInteractive = true;
      updateMouseEventsPassThrough();
    });
    el.addEventListener('mouseleave', () => {
      // Delay slightly to prevent flicker when crossing child borders
      setTimeout(() => {
        const stillHovering = interactiveElements.some((elem) => elem && elem.matches(':hover'));
        if (!stillHovering) {
          isHoveringInteractive = false;
          updateMouseEventsPassThrough();
        }
      }, 50);
    });
  });

  // ==========================================
  // Physics Simulation
  // ==========================================
  // Pendulum state (angles in radians)
  let theta = 0;             // Angular displacement
  let omega = 0;             // Angular velocity
  let alpha = 0;             // Angular acceleration

  // Physical constants
  const gravity = 18.0;      // Effective gravitational constant
  const length = 1.0;        // Length of pendulum arm
  const baseDamping = 0.85;  // Air resistance damping factor
  const maxTheta = 0.75;     // Limit maximum swing angle (~43 degrees)

  let lastTime = performance.now();
  let timeElapsed = 0;

  // Track mouse movements for velocity nudge
  let lastMouseX = null;
  let lastMouseTime = null;

  function physicsLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.033);
    lastTime = currentTime;

    if (settings.animationEnabled) {
      timeElapsed += dt * settings.animationSpeed;

      if (!isDragging) {
        // Natural organic idle breeze perturbation
        const ambientForce = (
          0.38 * Math.sin(timeElapsed * 1.6) +
          0.18 * Math.sin(timeElapsed * 3.4 + 1.2) +
          0.08 * Math.cos(timeElapsed * 0.7)
        ) * settings.swingIntensity;

        // Pendulum equation: alpha = - (g/L) * sin(theta) - damping * omega + ambient
        alpha = -(gravity / length) * Math.sin(theta) * settings.swingIntensity
                - (baseDamping * omega)
                + ambientForce;

        omega += alpha * dt * settings.animationSpeed;
        theta += omega * dt * settings.animationSpeed;

        // Clamp angle within realistic visual bounds
        if (theta > maxTheta) {
          theta = maxTheta;
          omega = -Math.abs(omega) * 0.4;
        } else if (theta < -maxTheta) {
          theta = -maxTheta;
          omega = Math.abs(omega) * 0.4;
        }
      }

      // Convert to degrees for rendering
      const degrees = (theta * 180) / Math.PI;

      // Subtle secondary mask tilt (mask wobbles slightly on the cord ring)
      const secondaryWobble = -degrees * 0.25 - (omega * 2.5);

      // Render transform
      pendulumAnchor.style.transform = `rotate(${degrees.toFixed(2)}deg)`;
      bommai.style.transform = `rotate(${secondaryWobble.toFixed(2)}deg)`;
    } else {
      // Animation disabled: smoothly ease back to upright rest position
      theta += (0 - theta) * 0.1;
      omega = 0;
      const degrees = (theta * 180) / Math.PI;
      pendulumAnchor.style.transform = `rotate(${degrees.toFixed(2)}deg)`;
      bommai.style.transform = `rotate(0deg)`;
    }

    requestAnimationFrame(physicsLoop);
  }

  requestAnimationFrame(physicsLoop);

  // ==========================================
  // Mouse Interaction (Push & Click)
  // ==========================================
  bommai.addEventListener('mousemove', (e) => {
    if (isDragging) return;

    const now = performance.now();
    if (lastMouseX !== null && lastMouseTime !== null) {
      const dt = (now - lastMouseTime) / 1000;
      if (dt > 0.005 && dt < 0.15) {
        const mouseVelocityX = (e.clientX - lastMouseX) / dt;
        // Apply directional nudge based on cursor motion
        if (Math.abs(mouseVelocityX) > 150) {
          const impulse = (mouseVelocityX / 1800) * settings.swingIntensity;
          omega += Math.max(-5.0, Math.min(5.0, impulse));
        }
      }
    }
    lastMouseX = e.clientX;
    lastMouseTime = now;
  });

  bommai.addEventListener('mouseleave', () => {
    lastMouseX = null;
    lastMouseTime = null;
  });

  // Clicking the Bommai causes a strong energetic swing
  bommai.addEventListener('click', (e) => {
    if (e.button !== 0) return; // Only left click
    if (isDragging) return;

    const rect = bommai.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;

    // Swing direction away from click side
    const direction = clickX < centerX ? 1 : -1;
    const clickImpulse = direction * (4.2 + Math.random() * 2.0) * settings.swingIntensity;

    omega += clickImpulse;

    // Quick visual spring pop
    bommai.style.transform = `scale(1.08)`;
    setTimeout(() => {
      bommai.style.transform = `scale(1.0)`;
    }, 120);
  });

  // ==========================================
  // Dragging & Horizontal Repositioning
  // ==========================================
  let dragStartX = 0;
  let didMove = false;

  function startDrag(e) {
    if (e.button !== 0) return; // Left click only
    closeContextMenu();

    isDragging = true;
    didMove = false;
    dragStartX = e.screenX;
    updateMouseEventsPassThrough();

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const deltaX = e.screenX - dragStartX;

    if (Math.abs(deltaX) > 0) {
      didMove = true;
      dragStartX = e.screenX;

      // Move the window horizontally across the screen edge
      if (window.electronAPI) {
        window.electronAPI.dragWindow(deltaX);
      }

      // Physics tilt while dragging
      const dragTilt = -Math.max(-0.45, Math.min(0.45, deltaX * 0.05));
      theta = dragTilt;
      omega = dragTilt * 4.0;
    }
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);

    // If released after a drag, give it a natural release swing
    if (didMove) {
      omega += (theta * -3.0) * settings.swingIntensity;
    }

    setTimeout(() => {
      updateMouseEventsPassThrough();
    }, 100);
  }

  // Can drag by either the top mount bracket or the Bommai itself
  topMount.addEventListener('mousedown', startDrag);
  bommai.addEventListener('mousedown', startDrag);

  // ==========================================
  // Context Menu
  // ==========================================
  function openContextMenu(x, y) {
    isContextMenuOpen = true;
    updateMouseEventsPassThrough();

    // Adjust position so it fits in the 240px window
    const menuWidth = 155;
    const posX = Math.min(x, 240 - menuWidth - 8);
    const posY = Math.min(y, 160);

    contextMenu.style.left = `${Math.max(8, posX)}px`;
    contextMenu.style.top = `${posY}px`;
    contextMenu.classList.add('active');
  }

  function closeContextMenu() {
    if (!isContextMenuOpen) return;
    isContextMenuOpen = false;
    contextMenu.classList.remove('active');
    updateMouseEventsPassThrough();
  }

  // Right-click on Bommai or mount opens context menu
  bommai.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY);
  });

  topMount.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY);
  });

  // Context menu actions
  const charmCycle = ['classic', 'terracotta', 'gold', 'chibi', 'spiderman', 'batman'];
  const menuNextCharm = document.getElementById('menuNextCharm');
  if (menuNextCharm) {
    menuNextCharm.addEventListener('click', () => {
      closeContextMenu();
      const currentIndex = charmCycle.indexOf(settings.currentCharm || 'classic');
      const nextIndex = (currentIndex + 1) % charmCycle.length;
      const nextCharm = charmCycle[nextIndex];
      settings.currentCharm = nextCharm;
      applySettings();
      if (window.electronAPI) {
        window.electronAPI.saveSettings({ currentCharm: nextCharm });
      }
    });
  }

  document.getElementById('menuSettings').addEventListener('click', () => {
    closeContextMenu();
    if (window.electronAPI) window.electronAPI.openSettings();
  });

  document.getElementById('menuLeft').addEventListener('click', () => {
    closeContextMenu();
    if (window.electronAPI) window.electronAPI.setPositionPreset('left');
  });

  document.getElementById('menuCenter').addEventListener('click', () => {
    closeContextMenu();
    if (window.electronAPI) window.electronAPI.setPositionPreset('center');
  });

  document.getElementById('menuRight').addEventListener('click', () => {
    closeContextMenu();
    if (window.electronAPI) window.electronAPI.setPositionPreset('right');
  });

  document.getElementById('menuHide').addEventListener('click', () => {
    closeContextMenu();
    if (window.electronAPI) window.electronAPI.hideBommai();
  });

  document.getElementById('menuQuit').addEventListener('click', () => {
    closeContextMenu();
    if (window.electronAPI) window.electronAPI.quitApp();
  });

  // Close context menu when clicking outside
  window.addEventListener('click', (e) => {
    if (isContextMenuOpen && !contextMenu.contains(e.target)) {
      closeContextMenu();
    }
  });
});
