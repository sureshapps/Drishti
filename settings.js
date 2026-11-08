// Drishti Dangle - Settings Management
document.addEventListener('DOMContentLoaded', async () => {
  const animCheckbox = document.getElementById('animationEnabled');
  const intensitySlider = document.getElementById('swingIntensity');
  const intensityVal = document.getElementById('intensityVal');
  const speedSlider = document.getElementById('animationSpeed');
  const speedVal = document.getElementById('speedVal');
  const showStringCheckbox = document.getElementById('showString');
  const startWindowsCheckbox = document.getElementById('startWithWindows');
  const btnReset = document.getElementById('btnReset');

  const posButtons = {
    left: document.getElementById('btnPosLeft'),
    center: document.getElementById('btnPosCenter'),
    right: document.getElementById('btnPosRight')
  };

  const charmCards = {
    classic: document.getElementById('charmCard-classic'),
    terracotta: document.getElementById('charmCard-terracotta'),
    gold: document.getElementById('charmCard-gold'),
    chibi: document.getElementById('charmCard-chibi'),
    spiderman: document.getElementById('charmCard-spiderman'),
    batman: document.getElementById('charmCard-batman')
  };

  const headerLogo = document.getElementById('headerLogo');

  function getCharmSvg(charm) {
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

  let currentSettings = {
    animationEnabled: true,
    swingIntensity: 1.0,
    animationSpeed: 1.0,
    position: 'center',
    startWithWindows: false,
    showString: true,
    currentCharm: 'classic'
  };

  // Load existing settings
  if (window.electronAPI) {
    try {
      const saved = await window.electronAPI.getSettings();
      if (saved) {
        currentSettings = { ...currentSettings, ...saved };
      }
    } catch (err) {
      console.warn('Error loading settings:', err);
    }
  }

  // Populate UI
  function updateUI() {
    animCheckbox.checked = !!currentSettings.animationEnabled;
    intensitySlider.value = currentSettings.swingIntensity;
    intensityVal.textContent = `${Number(currentSettings.swingIntensity).toFixed(1)}x`;

    speedSlider.value = currentSettings.animationSpeed;
    speedVal.textContent = `${Number(currentSettings.animationSpeed).toFixed(1)}x`;

    showStringCheckbox.checked = !!currentSettings.showString;
    startWindowsCheckbox.checked = !!currentSettings.startWithWindows;

    // Charm cards
    const activeCharm = currentSettings.currentCharm || 'classic';
    Object.keys(charmCards).forEach((key) => {
      const card = charmCards[key];
      if (card) {
        if (key === activeCharm) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      }
    });

    if (headerLogo) {
      headerLogo.src = getCharmSvg(activeCharm);
    }

    // Position buttons
    Object.keys(posButtons).forEach((pos) => {
      if (posButtons[pos]) {
        if (currentSettings.position === pos) {
          posButtons[pos].classList.add('active');
        } else {
          posButtons[pos].classList.remove('active');
        }
      }
    });
  }

  updateUI();

  // Save settings helper
  async function save() {
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(currentSettings);
    }
  }

  // Event Listeners
  animCheckbox.addEventListener('change', () => {
    currentSettings.animationEnabled = animCheckbox.checked;
    save();
  });

  intensitySlider.addEventListener('input', () => {
    const val = parseFloat(intensitySlider.value);
    intensityVal.textContent = `${val.toFixed(1)}x`;
    currentSettings.swingIntensity = val;
    save();
  });

  speedSlider.addEventListener('input', () => {
    const val = parseFloat(speedSlider.value);
    speedVal.textContent = `${val.toFixed(1)}x`;
    currentSettings.animationSpeed = val;
    save();
  });

  showStringCheckbox.addEventListener('change', () => {
    currentSettings.showString = showStringCheckbox.checked;
    save();
  });

  startWindowsCheckbox.addEventListener('change', () => {
    currentSettings.startWithWindows = startWindowsCheckbox.checked;
    save();
  });

  // Segmented position buttons
  Object.keys(posButtons).forEach((pos) => {
    const btn = posButtons[pos];
    if (btn) {
      btn.addEventListener('click', () => {
        currentSettings.position = pos;
        updateUI();
        save();
      });
    }
  });

  // Charm selection cards
  Object.keys(charmCards).forEach((key) => {
    const card = charmCards[key];
    if (card) {
      card.addEventListener('click', () => {
        currentSettings.currentCharm = key;
        updateUI();
        save();
      });
    }
  });

  // Reset button
  btnReset.addEventListener('click', () => {
    currentSettings = {
      animationEnabled: true,
      swingIntensity: 1.0,
      animationSpeed: 1.0,
      position: 'center',
      startWithWindows: false,
      showString: true,
      customX: null,
      currentCharm: 'classic'
    };
    updateUI();
    save();
  });
});
