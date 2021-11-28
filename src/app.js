import { version } from '../package.json';
import RouteState from 'route-state';
import handleError from 'handle-error-web';
import curry from 'lodash.curry';
import kebabCase from 'lodash.kebabcase';
import domToImage from 'dom-to-image';

const DEFAULT_VALUES = {
  kerning: '0.000',
  altBg: false,
  altBgOpacity: 100,
};

const advancedControlsParams = ['kerning', 'altBg', 'altBgOpacity'];
var formWired = false;
var advancedControlsAreVisible = false;

var faviconEl = document.querySelector('link[rel~=icon]');
var textFieldEl = document.getElementById('text-field');

var fontSizeSliderEl = document.getElementById('font-size-slider');
var fontSizeLabelEl = document.getElementById('font-size-label');

var formEl = document.querySelector('.form');
var advancedControls = document.querySelectorAll('.advanced-controls');
var formExpander = document.querySelector('.form-expander');

var kerningSliderEl = document.getElementById('kerning-slider');
var kerningLabelEl = document.getElementById('kerning-label');

var altBgToggle = document.getElementById('alt-bg-toggle');
var altBgOverlayEl = document.getElementById('alt-bg-overlay');
var altBgControlsEl = document.getElementById('alt-bg-controls');
var altBgOpacitySliderEl = document.getElementById('alt-bg-opacity-slider');
var altBgOpacityLabelEl = document.getElementById('alt-bg-opacity-label');

var downloadLinkEl = document.getElementById('download-link');

var emojiTextEl = document.getElementById('emoji-text');
var buildButtonEl = document.getElementById('build-button');
var previewStageEl = document.getElementById('preview-stage');
var resultImageEl = document.getElementById('result-image');
var resultImageElSm = document.getElementById('result-image-sm');
var resultImageElXs = document.getElementById('result-image-xs');
var resultImageElSmDk = document.getElementById('result-image-sm-dk');
var resultImageElXsDk = document.getElementById('result-image-xs-dk');
var resultSectionEl = document.querySelector('.result');
var resultInstructionEl = document.getElementById('result-instruction');
var darkModeToggle = document.getElementById('dark-theme-toggle');
var darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

var routeState = RouteState({
  followRoute,
  windowObject: window,
  propsToCoerceToBool: ['altBg'],
});

(function go() {
  window.onerror = reportTopLevelError;
  renderVersion();
  routeState.routeFromHash();
})();

function followRoute({
  text = 'lol',
  fontSize = 100,
  kerning = DEFAULT_VALUES.kerning,
  altBg = DEFAULT_VALUES.altBg,
  altBgOpacity = DEFAULT_VALUES.altBgOpacity,
}) {
  updateForm({
    text,
    fontSize,
    kerning,
    altBg,
    altBgOpacity,
  });
  renderPreview({
    text,
    fontSize,
    kerning: kerning !== DEFAULT_VALUES.kerning && kerning,
    altBgOpacity,
  });
  wireForm({
    kerning,
    altBg,
    altBgOpacity,
  });
}

function updateForm({ text, fontSize, kerning, altBg, altBgOpacity }) {
  textFieldEl.value = text;
  fontSizeSliderEl.value = fontSize;
  fontSizeLabelEl.textContent = fontSize;

  kerningSliderEl.value = kerning;
  kerningLabelEl.textContent = kerning;

  altBgToggle.checked = altBg;
  altBgControlsEl.style.visibility = altBg ? 'visible' : 'hidden';
  altBgOverlayEl.style.display = altBg ? 'inherit' : 'none';
  altBgOpacitySliderEl.value = altBgOpacity;
  altBgOpacityLabelEl.textContent = altBgOpacity;
}

function renderPreview({ text, fontSize, kerning, altBgOpacity }) {
  emojiTextEl.style.fontSize = fontSize + 'px';
  emojiTextEl.textContent = text;
  if (kerning) {
    emojiTextEl.style.letterSpacing = kerning + 'em';
  } else {
    emojiTextEl.style.removeProperty('letter-spacing');
  }
  altBgOverlayEl.style.opacity = altBgOpacity / 100;
}

function wireForm({kerning, altBg, altBgOpacity}) {
  if (formWired) {
    return;
  }

  textFieldEl.addEventListener(
    'keyup',
    curry(updateRoute)('text', textFieldEl)
  );
  fontSizeSliderEl.addEventListener(
    'input',
    curry(updateRoute)('fontSize', fontSizeSliderEl)
  );
  fontSizeSliderEl.addEventListener('change', updateFontSizeLabel);

  advancedControlsAreVisible = areAdvancedControlsModified({kerning, altBg, altBgOpacity});
  formEl.classList.toggle('expanded', advancedControlsAreVisible);
  advancedControls.forEach(({classList}) => classList.toggle('hidden', !advancedControlsAreVisible));
  
  formExpander.classList.toggle('hidden', false);
  
  formExpander.addEventListener('mouseenter', () => {
    formEl.classList.toggle('highlighted', true);
  });
  
  formExpander.addEventListener('mouseleave', () => {
    formEl.classList.toggle('highlighted', false);
  });
  
  formExpander.addEventListener('click', toggleAdvancedControls);

  kerningSliderEl.addEventListener('input', curry(updateRoute)('kerning', kerningSliderEl));
  kerningSliderEl.addEventListener('input', updateKerningLabel);

  altBgToggle.addEventListener('change', (e) => {
    e.composing;
    if (altBgToggle.checked) {
      routeState.addToRoute({ altBg: altBgToggle.checked });
    } else {
      routeState.removeFromRoute('altBg');
    }
  });

  altBgOpacitySliderEl.addEventListener(
    'input',
    curry(updateRoute)('altBgOpacity', altBgOpacitySliderEl)
  );
  altBgOpacitySliderEl.addEventListener('input', updateAltBgOpacityLabel);

  buildButtonEl.addEventListener('click', onBuildClick);

  setThemeInfo();
  darkMediaQuery.addEventListener('change', () => {
    setThemeInfo();
  });
  
  darkModeToggle.addEventListener('click', () => {
    var preferAltTheme = document.documentElement.classList.toggle('alt-theme');
    localStorage.setItem('preferAltTheme', preferAltTheme);
    setThemeInfo();
  });

  formWired = true;
}

function updateRoute(prop, inputEl, e) {
  e.composing;
  routeState.addToRoute({ [prop]: inputEl.value });
}

function updateFontSizeLabel() {
  fontSizeLabelEl.textContent = fontSizeSliderEl.value;
}

function updateKerningLabel() {
  kerningLabelEl.textContent = kerningSliderEl.value.toString().padEnd(5, '0');
}

function updateAltBgOpacityLabel() {
  altBgOpacityLabelEl.textContent = altBgOpacitySliderEl.value;
}

function onBuildClick() {
  resultSectionEl.classList.remove('hidden');
  domToImage
    .toPng(previewStageEl)
    .then(curry(renderResult)(kebabCase(textFieldEl.value)))
    .catch(handleError);
}

function renderResult(name, dataURL) {
  resultImageEl.src = dataURL;
  resultImageElSm.src = dataURL;
  resultImageElXs.src = dataURL;
  resultImageElSmDk.src = dataURL;
  resultImageElXsDk.src = dataURL;

  downloadLinkEl.download = name;
  downloadLinkEl.href = dataURL;

  faviconEl.href = dataURL;

  resultInstructionEl.classList.remove('hidden');
}

function renderVersion() {
  document.getElementById('version-info').textContent = version;
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}

function areAdvancedControlsModified (controlValues) {
  return advancedControlsParams.some((param) => DEFAULT_VALUES[param] !== controlValues[param]);
}

function toggleAdvancedControls () {
  advancedControlsAreVisible = !advancedControlsAreVisible;
  formExpander.textContent = advancedControlsAreVisible ? 'Less' : 'More';
  formEl.classList.toggle('expanded', advancedControlsAreVisible);
  advancedControls.forEach(({classList}) => classList.toggle('hidden', !advancedControlsAreVisible));
  if (advancedControlsAreVisible) {
    advancedControls[0].querySelector('input').focus();
  } else {
    formEl.querySelector('input').focus();
  }
}

function setThemeInfo() {
  const preferAltTheme = JSON.parse(localStorage.getItem('preferAltTheme'));
  const otherName = (darkMediaQuery.matches ? !preferAltTheme : preferAltTheme) ? 'light' : 'dark';
  document.documentElement.classList.toggle('alt-theme', preferAltTheme);
  darkModeToggle.textContent = `Use ${otherName} theme`;
}
