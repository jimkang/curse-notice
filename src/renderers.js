import { version } from '../package.json';

var fontSizeLabelEl = document.getElementById('font-size-label');
var fontSizeSliderEl = document.getElementById('font-size-slider');
var kerningLabelEl = document.getElementById('kerning-label');
var kerningSliderEl = document.getElementById('kerning-slider');
var dialogTextEl = document.querySelector('.dialog-text');
var formExpander = document.querySelector('.form-expander');
var advancedControls = document.querySelectorAll('.advanced-controls');
var formEl = document.querySelector('.form');
var darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
var darkModeToggle = document.getElementById('dark-theme-toggle');

export function renderCollage({ text, fontSize, kerning }) {
  dialogTextEl.style.fontSize = fontSize + 'px';
  if (text) {
    dialogTextEl.innerText = text;
  }
  if (kerning) {
    dialogTextEl.style.letterSpacing = kerning + 'em';
  } else {
    dialogTextEl.style.removeProperty('letter-spacing');
  }
}

export function updateForm({ text, fontSize, kerning, }) {
  dialogTextEl.textContent = text;
  fontSizeSliderEl.value = fontSize;
  fontSizeLabelEl.textContent = fontSize;

  kerningSliderEl.value = kerning;
  kerningLabelEl.textContent = kerning;
}

export function renderVersion() {
  document.getElementById('version-info').textContent = version;
}

export function toggleAdvancedControls({ ctrlState }) {
  ctrlState.advancedControlsAreVisible = !ctrlState.advancedControlsAreVisible;
  renderAdvancedControls({ ctrlState });
  formEl.classList.toggle('expanded', ctrlState.advancedControlsAreVisible);
  advancedControls.forEach(({classList}) => classList.toggle('hidden', !ctrlState.advancedControlsAreVisible));
  if (ctrlState.advancedControlsAreVisible) {
    advancedControls[0].querySelector('input').focus();
  } else {
    formEl.querySelector('input').focus();
  }
}

export function renderAdvancedControls({ ctrlState }) {
  formExpander.textContent = ctrlState.advancedControlsAreVisible ? 'Less' : 'More edit controls';
}

export function setThemeInfo() {
  const preferAltTheme = JSON.parse(localStorage.getItem('preferAltTheme'));
  const otherName = (darkMediaQuery.matches ? !preferAltTheme : preferAltTheme) ? 'light' : 'dark';
  document.documentElement.classList.toggle('alt-theme', preferAltTheme);
  darkModeToggle.textContent = `Use ${otherName} theme`;
}

export function updateFontSizeLabel() {
  fontSizeLabelEl.textContent = fontSizeSliderEl.value;
}

export function updateKerningLabel() {
  kerningLabelEl.textContent = kerningSliderEl.value.toString().padEnd(5, '0');
}


