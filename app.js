// JCE Faculty Time Table Mobile App - JavaScript

const STORAGE_KEY = 'jce_timetable_state_v1';

// Days configuration
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Time slots configuration from docx template
const TIME_SLOTS = [
  { id: 0, label: '08:30AM - 09:25AM', isBreak: false },
  { id: 1, label: '09:25AM - 10:20AM', isBreak: false },
  { id: 2, label: '10:20AM - 10:35AM', isBreak: true, breakType: 'tea', breakTitle: '☕ TEA BREAK', spanAll: true },
  { id: 3, label: '10:35AM - 11:30AM', isBreak: false },
  { id: 4, label: '11:30AM - 12:25PM', isBreak: false },
  { id: 5, label: '12:25PM - 01:00PM', isBreak: true, breakType: 'lunch', breakTitle: '🍱 LUNCH BREAK', spanMonFri: true },
  { id: 6, label: '01:00PM - 01:55PM', isBreak: false },
  { id: 7, label: '01:55PM - 02:50PM', isBreak: false },
  { id: 8, label: '02:50PM - 03:50PM', isBreak: false }
];

// Default Initial State
const defaultState = {
  mode: 'display', // 'edit' or 'display'
  viewMode: 'grid', // 'grid' or 'day'
  orientation: 'portrait', // 'portrait' or 'landscape'
  selectedDay: getInitialDay(),
  meta: {
    facultyName: '',
    academicYear: '2026-2027',
    classVal: 'III-C SEMESTER',
    wef: '07/09/2026'
  },
  slots: {} // { [day]: { [slotIndex]: { subject, room, batch, type } } }
};

// Current App State
let state = loadSavedState();
let activeEditingSlot = null; // { day, slotIndex }

// Helper to get current day of week
function getInitialDay() {
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  if (dayIndex >= 1 && dayIndex <= 6) {
    return DAYS[dayIndex - 1];
  }
  return 'Monday';
}

// Load state from localStorage
function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        meta: { ...defaultState.meta, ...(parsed.meta || {}) },
        slots: parsed.slots || {}
      };
    }
  } catch (e) {
    console.error('Error loading saved state:', e);
  }
  return JSON.parse(JSON.stringify(defaultState));
}

// Save state to localStorage
function saveState(notify = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (notify) {
      showToast('Changes saved successfully');
    }
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  renderApp();
  registerServiceWorker();
});

// Setup Event Listeners and UI Bindings
function initUI() {
  // Mode Switcher buttons (Top options: Edit vs Display)
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const newMode = btn.getAttribute('data-mode');
      setMode(newMode);
    });
  });

  // Sub-toggle (Grid vs Day view)
  const subToggleBtns = document.querySelectorAll('.sub-toggle-btn');
  subToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const newView = btn.getAttribute('data-view');
      setViewMode(newView);
    });
  });

  // Orientation toggle (Portrait vs Landscape)
  const orientBtns = document.querySelectorAll('.orientation-btn');
  orientBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const orient = btn.getAttribute('data-orientation');
      setOrientation(orient, true);
    });
  });

  // Automatically adapt if user rotates mobile device physically
  if (window.matchMedia) {
    window.matchMedia('(orientation: landscape)').addEventListener('change', (e) => {
      setOrientation(e.matches ? 'landscape' : 'portrait', false);
    });
  }

  // Metadata input listeners
  bindMetaInput('input-faculty-name', 'facultyName');
  bindMetaInput('input-academic-year', 'academicYear');
  bindMetaInput('input-class', 'classVal');
  bindMetaInput('input-wef', 'wef');

  // Modal Sheet controls
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.getElementById('modal-save-btn').addEventListener('click', saveModalSlot);
  document.getElementById('modal-clear-btn').addEventListener('click', clearModalSlot);

  // Type pills in modal
  const typePills = document.querySelectorAll('.type-pill');
  typePills.forEach(pill => {
    pill.addEventListener('click', () => {
      typePills.forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });

  // Action Bar Buttons
  document.getElementById('btn-export-pdf').addEventListener('click', () => {
    window.print();
  });

  // Install button and modal
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  const installModal = document.getElementById('install-modal-overlay');
  document.getElementById('btn-install-app').addEventListener('click', () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('App installing to home screen!');
        }
        deferredInstallPrompt = null;
      });
    } else {
      installModal.classList.add('open');
    }
  });

  document.getElementById('install-modal-close-btn').addEventListener('click', () => {
    installModal.classList.remove('open');
  });
  installModal.addEventListener('click', (e) => {
    if (e.target === installModal) installModal.classList.remove('open');
  });

  document.getElementById('btn-trigger-pwa-install').addEventListener('click', () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
    } else {
      alert("To add to home screen:\n1. Tap Chrome's menu (3 dots ⋮ at top right)\n2. Tap 'Add to Home screen' or 'Add shortcut'");
    }
    installModal.classList.remove('open');
  });

  document.getElementById('btn-sample-data').addEventListener('click', loadSampleData);
  document.getElementById('btn-clear-all').addEventListener('click', clearAllData);
  document.getElementById('btn-backup-json').addEventListener('click', exportJSON);
  document.getElementById('btn-restore-json').addEventListener('click', () => {
    document.getElementById('json-file-input').click();
  });
  document.getElementById('json-file-input').addEventListener('change', importJSON);
}

// Bind metadata inputs to state
function bindMetaInput(id, field) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    state.meta[field] = e.target.value;
    updateMetaDisplay(field);
    saveState();
  });
}

// Update text display for meta field
function updateMetaDisplay(field) {
  const displayEl = document.getElementById(`display-${field}`);
  if (displayEl) {
    displayEl.textContent = state.meta[field] || '—';
  }
}

// Switch between Edit Mode and Display View
function setMode(mode) {
  state.mode = mode;
  saveState();

  // Update Body class
  document.body.classList.remove('mode-edit', 'mode-display');
  document.body.classList.add(`mode-${mode}`);

  // Update Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
  });

  // Update Status Badge
  const statusBadge = document.getElementById('mode-status-indicator');
  if (statusBadge) {
    if (mode === 'edit') {
      statusBadge.className = 'mode-status-badge edit-mode';
      statusBadge.innerHTML = '<span class="pulse-dot"></span> Edit Mode Active: Tap any slot to edit';
    } else {
      statusBadge.className = 'mode-status-badge display-mode';
      statusBadge.innerHTML = '<span class="pulse-dot"></span> Read only mode';
    }
  }

  showToast(mode === 'edit' ? '✏️ Edit Mode Enabled' : '👁️ Read only mode');
  renderTimetable();
}

// Switch between Table Grid View and Mobile Day View
function setViewMode(viewMode) {
  state.viewMode = viewMode;
  saveState();

  document.querySelectorAll('.sub-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewMode);
  });

  const gridContainer = document.getElementById('grid-view-container');
  const dayContainer = document.getElementById('day-view-container');

  if (viewMode === 'day') {
    gridContainer.style.display = 'none';
    dayContainer.classList.add('active');
    renderDayView();
  } else {
    gridContainer.style.display = 'block';
    dayContainer.classList.remove('active');
  }
}

// Switch between Portrait and Landscape Mode
function setOrientation(orient, tryLock = true) {
  state.orientation = orient;
  saveState();

  document.body.classList.toggle('orientation-landscape', orient === 'landscape');

  document.querySelectorAll('.orientation-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-orientation') === orient);
  });

  if (orient === 'landscape') {
    // Landscape mode is optimized for full table view
    setViewMode('grid');
    if (tryLock && screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
    showToast('🔄 Landscape Mode');
  } else {
    if (tryLock && screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait').catch(() => {});
    }
    showToast('📱 Portrait Mode');
  }
}

// Render complete application UI
function renderApp() {
  // Sync metadata inputs
  document.getElementById('input-faculty-name').value = state.meta.facultyName || '';
  document.getElementById('input-academic-year').value = state.meta.academicYear || '';
  document.getElementById('input-class').value = state.meta.classVal || '';
  document.getElementById('input-wef').value = state.meta.wef || '';

  // Sync metadata displays
  updateMetaDisplay('facultyName');
  updateMetaDisplay('academicYear');
  updateMetaDisplay('classVal');
  updateMetaDisplay('wef');

  // Apply current mode and orientation
  setMode(state.mode);
  setViewMode(state.viewMode);
  setOrientation(state.orientation || 'portrait', false);
  renderTimetable();
}

// Render Table Grid
function renderTimetable() {
  const tbody = document.getElementById('timetable-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  TIME_SLOTS.forEach(slot => {
    const tr = document.createElement('tr');

    // Col 0: Time Label
    const timeTd = document.createElement('td');
    timeTd.className = 'tt-time-col';
    timeTd.innerHTML = `<div>${slot.label.replace(' - ', '<br>')}</div>`;
    tr.appendChild(timeTd);

    // Row 2: Tea Break (Spans all 6 days)
    if (slot.spanAll) {
      const breakTd = document.createElement('td');
      breakTd.colSpan = 6;
      breakTd.className = 'tt-break-cell';
      breakTd.innerHTML = `<span class="tea-break-badge">☕ TEA BREAK (10:20 AM - 10:35 AM)</span>`;
      tr.appendChild(breakTd);
    } 
    // Row 5: Lunch Break (Spans Mon-Fri; Saturday has separate slot)
    else if (slot.spanMonFri) {
      const lunchTd = document.createElement('td');
      lunchTd.colSpan = 5;
      lunchTd.className = 'tt-break-cell';
      lunchTd.innerHTML = `<span class="lunch-break-badge">🍱 LUNCH BREAK (12:25 PM - 01:00 PM)</span>`;
      tr.appendChild(lunchTd);

      // Saturday slot for 12:25 - 01:00
      const satTd = createSlotCell('Saturday', slot.id);
      tr.appendChild(satTd);
    } 
    // Normal Periods
    else {
      DAYS.forEach(day => {
        const td = createSlotCell(day, slot.id);
        tr.appendChild(td);
      });
    }

    tbody.appendChild(tr);
  });
}

// Create a single timetable cell
function createSlotCell(day, slotId) {
  const td = document.createElement('td');
  td.className = 'tt-slot';
  td.dataset.day = day;
  td.dataset.slotId = slotId;

  const slotData = getSlotData(day, slotId);

  if (slotData && slotData.subject && slotData.subject.trim() !== '') {
    td.classList.add('has-content');
    const typeClass = slotData.type ? `type-${slotData.type}` : 'type-general';
    td.innerHTML = `
      <div class="slot-content-display ${typeClass}">
        <span class="slot-subject-title">${escapeHtml(slotData.subject)}</span>
        ${(slotData.room || slotData.batch) ? `
          <div class="slot-meta-tag">
            ${slotData.room ? `<span class="slot-room-chip">${escapeHtml(slotData.room)}</span>` : ''}
            ${slotData.batch ? `<span class="slot-batch-chip">${escapeHtml(slotData.batch)}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  } else {
    td.innerHTML = `<div class="slot-empty-display">—</div>`;
  }

  // Cell Click Handler (Active in Edit Mode)
  td.addEventListener('click', () => {
    if (state.mode === 'edit') {
      openModal(day, slotId);
    }
  });

  return td;
}

// Get slot data from state
function getSlotData(day, slotId) {
  if (state.slots && state.slots[day] && state.slots[day][slotId]) {
    return state.slots[day][slotId];
  }
  return null;
}

// Set slot data in state
function setSlotData(day, slotId, data) {
  if (!state.slots[day]) {
    state.slots[day] = {};
  }
  state.slots[day][slotId] = data;
  saveState();
}

// Render Mobile Day View
function renderDayView() {
  const dayPillsContainer = document.getElementById('day-pills-container');
  const dayCardsContainer = document.getElementById('day-cards-container');
  if (!dayPillsContainer || !dayCardsContainer) return;

  // Render Day Selector Pills
  dayPillsContainer.innerHTML = '';
  DAYS.forEach(day => {
    const btn = document.createElement('button');
    btn.className = `day-pill-btn ${state.selectedDay === day ? 'active' : ''}`;
    btn.textContent = day.substring(0, 3);
    btn.title = day;
    btn.addEventListener('click', () => {
      state.selectedDay = day;
      renderDayView();
    });
    dayPillsContainer.appendChild(btn);
  });

  // Render Cards for the Selected Day
  dayCardsContainer.innerHTML = '';
  const currentDay = state.selectedDay;

  TIME_SLOTS.forEach(slot => {
    const card = document.createElement('div');
    card.className = 'day-slot-card';

    // Tea Break Card
    if (slot.spanAll) {
      card.classList.add('break-card', 'tea-break-card');
      card.innerHTML = `
        <div class="day-card-time">${slot.label}</div>
        <div class="day-card-body">
          <div class="day-card-title">☕ Tea Break</div>
          <div class="day-card-meta">Campus Break Interval</div>
        </div>
      `;
    } 
    // Lunch Break Card (Mon-Fri)
    else if (slot.spanMonFri && currentDay !== 'Saturday') {
      card.classList.add('break-card', 'lunch-break-card');
      card.innerHTML = `
        <div class="day-card-time">${slot.label}</div>
        <div class="day-card-body">
          <div class="day-card-title">🍱 Lunch Break</div>
          <div class="day-card-meta">Mid-Day Meal Recess</div>
        </div>
      `;
    } 
    // Normal Slot Card
    else {
      const slotData = getSlotData(currentDay, slot.id);
      const hasContent = slotData && slotData.subject && slotData.subject.trim() !== '';

      card.innerHTML = `
        <div class="day-card-time">${slot.label}</div>
        <div class="day-card-body">
          <div class="day-card-title">${hasContent ? escapeHtml(slotData.subject) : (state.mode === 'edit' ? '<span style="color:#0284c7;">+ Add Subject</span>' : '<span style="color:#94a3b8;">Free Period</span>')}</div>
          ${hasContent && (slotData.room || slotData.batch || slotData.type) ? `
            <div class="day-card-meta">
              ${slotData.room ? `<span>📍 ${escapeHtml(slotData.room)}</span>` : ''}
              ${slotData.batch ? `<span>👥 ${escapeHtml(slotData.batch)}</span>` : ''}
              ${slotData.type ? `<span style="text-transform:capitalize;">🏷️ ${escapeHtml(slotData.type)}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;

      if (state.mode === 'edit') {
        card.addEventListener('click', () => {
          openModal(currentDay, slot.id);
        });
      }
    }

    dayCardsContainer.appendChild(card);
  });
}

// Open Modal Bottom Sheet for Editing a Slot
function openModal(day, slotId) {
  activeEditingSlot = { day, slotId };
  const slotObj = TIME_SLOTS.find(s => s.id === slotId);

  document.getElementById('modal-slot-title').textContent = `${day} • ${slotObj ? slotObj.label : ''}`;

  const currentData = getSlotData(day, slotId) || { subject: '', room: '', batch: '', type: 'lecture' };

  document.getElementById('modal-subject-input').value = currentData.subject || '';
  document.getElementById('modal-room-input').value = currentData.room || '';
  document.getElementById('modal-batch-input').value = currentData.batch || '';

  // Select Type Pill
  const typePills = document.querySelectorAll('.type-pill');
  typePills.forEach(p => {
    p.classList.toggle('selected', p.getAttribute('data-type') === (currentData.type || 'lecture'));
  });

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.getElementById('modal-subject-input').focus();
}

// Close Modal Bottom Sheet
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  activeEditingSlot = null;
}

// Save Modal Slot Data
function saveModalSlot() {
  if (!activeEditingSlot) return;

  const { day, slotId } = activeEditingSlot;
  const subject = document.getElementById('modal-subject-input').value.trim();
  const room = document.getElementById('modal-room-input').value.trim();
  const batch = document.getElementById('modal-batch-input').value.trim();

  const selectedPill = document.querySelector('.type-pill.selected');
  const type = selectedPill ? selectedPill.getAttribute('data-type') : 'lecture';

  setSlotData(day, slotId, { subject, room, batch, type });

  closeModal();
  renderTimetable();
  if (state.viewMode === 'day') {
    renderDayView();
  }
  showToast('Slot updated');
}

// Clear Modal Slot Data
function clearModalSlot() {
  if (!activeEditingSlot) return;
  const { day, slotId } = activeEditingSlot;
  setSlotData(day, slotId, null);

  closeModal();
  renderTimetable();
  if (state.viewMode === 'day') {
    renderDayView();
  }
  showToast('Slot cleared');
}

// Load Realistic CSE Sample Data
function loadSampleData() {
  if (!confirm('Load sample CSE Department timetable data? This will populate the fields for demonstration.')) {
    return;
  }

  state.meta = {
    facultyName: 'Dr. Ramesh Patil',
    academicYear: '2026-2027',
    classVal: 'III-C SEMESTER',
    wef: '07/09/2026'
  };

  state.slots = {
    Monday: {
      0: { subject: '21CS51 - CNS', room: 'LH-301', batch: 'All', type: 'lecture' },
      1: { subject: '21CS52 - DBMS', room: 'LH-301', batch: 'All', type: 'lecture' },
      3: { subject: '21CS53 - ATC', room: 'LH-301', batch: 'All', type: 'lecture' },
      4: { subject: '21CSL57 - CN Lab', room: 'Lab 2', batch: 'B1', type: 'lab' },
      6: { subject: '21CSL57 - CN Lab', room: 'Lab 2', batch: 'B1', type: 'lab' },
      7: { subject: '21CS54 - ADP', room: 'LH-301', batch: 'All', type: 'lecture' }
    },
    Tuesday: {
      0: { subject: '21CS52 - DBMS', room: 'LH-301', batch: 'All', type: 'lecture' },
      1: { subject: '21CS54 - ADP', room: 'LH-301', batch: 'All', type: 'lecture' },
      3: { subject: '21CS51 - CNS', room: 'LH-301', batch: 'All', type: 'lecture' },
      4: { subject: 'Mentoring / Remedial', room: 'LH-301', batch: '', type: 'meeting' },
      6: { subject: '21CSL58 - DBMS Lab', room: 'Lab 3', batch: 'B2', type: 'lab' },
      7: { subject: '21CSL58 - DBMS Lab', room: 'Lab 3', batch: 'B2', type: 'lab' }
    },
    Wednesday: {
      0: { subject: '21CS53 - ATC', room: 'LH-301', batch: 'All', type: 'lecture' },
      1: { subject: '21CS51 - CNS', room: 'LH-301', batch: 'All', type: 'lecture' },
      3: { subject: '21CS52 - DBMS', room: 'LH-301', batch: 'All', type: 'lecture' },
      4: { subject: 'Project Phase-1', room: 'Project Lab', batch: 'B1+B2', type: 'lab' },
      6: { subject: '21CS54 - ADP', room: 'LH-301', batch: 'All', type: 'lecture' },
      7: { subject: 'Department Library', room: 'Library', batch: '', type: 'general' }
    },
    Thursday: {
      0: { subject: '21CS54 - ADP', room: 'LH-301', batch: 'All', type: 'lecture' },
      1: { subject: '21CS53 - ATC', room: 'LH-301', batch: 'All', type: 'lecture' },
      3: { subject: '21CS51 - CNS (Tut)', room: 'LH-301', batch: 'All', type: 'tutorial' },
      4: { subject: '21CS52 - DBMS', room: 'LH-301', batch: 'All', type: 'lecture' },
      6: { subject: 'Mini Project', room: 'Lab 1', batch: 'B1', type: 'lab' },
      7: { subject: 'Mini Project', room: 'Lab 1', batch: 'B1', type: 'lab' }
    },
    Friday: {
      0: { subject: '21CS52 - DBMS (Tut)', room: 'LH-301', batch: 'All', type: 'tutorial' },
      1: { subject: '21CS53 - ATC', room: 'LH-301', batch: 'All', type: 'lecture' },
      3: { subject: '21CS51 - CNS', room: 'LH-301', batch: 'All', type: 'lecture' },
      4: { subject: 'Technical Seminar', room: 'Seminar Hall', batch: 'All', type: 'meeting' },
      6: { subject: 'NSS / Forum Activity', room: 'Auditorium', batch: 'All', type: 'general' }
    },
    Saturday: {
      0: { subject: '21CS53 - ATC (Tut)', room: 'LH-301', batch: 'All', type: 'tutorial' },
      1: { subject: '21CS54 - ADP', room: 'LH-301', batch: 'All', type: 'lecture' },
      3: { subject: 'Faculty Meeting', room: 'Conference Hall', batch: '', type: 'meeting' },
      4: { subject: 'Curriculum Planning', room: 'Dept Office', batch: '', type: 'general' }
    }
  };

  saveState();
  renderApp();
  showToast('Sample CSE timetable loaded');
}

// Clear All Data back to Blank Template
function clearAllData() {
  if (!confirm('Clear all timetable entries and reset to blank template?')) {
    return;
  }
  state.slots = {};
  state.meta.facultyName = '';
  saveState();
  renderApp();
  showToast('Timetable reset to blank template');
}

// Export State to JSON
function exportJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const faculty = state.meta.facultyName ? state.meta.facultyName.replace(/\s+/g, '_') : 'TimeTable';
  downloadAnchor.setAttribute('download', `JCE_${faculty}_Timetable.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Exported timetable backup JSON');
}

// Import State from JSON
function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && (imported.slots || imported.meta)) {
        state = {
          ...defaultState,
          ...imported,
          meta: { ...defaultState.meta, ...(imported.meta || {}) },
          slots: imported.slots || {}
        };
        saveState();
        renderApp();
        showToast('Timetable imported successfully');
      } else {
        alert('Invalid timetable JSON file.');
      }
    } catch (err) {
      alert('Error parsing JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // Reset input
}

// Show Toast Notice
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toast-notice');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// HTML escape helper
function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Register Offline Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('JCE ServiceWorker registered with scope:', reg.scope);
        })
        .catch(err => {
          console.log('JCE ServiceWorker registration failed:', err);
        });
    });
  }
}
