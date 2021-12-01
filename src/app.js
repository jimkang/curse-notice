import { version } from '../package.json';
import RouteState from 'route-state';
import handleError from 'handle-error-web';
import curry from 'lodash.curry';
import kebabCase from 'lodash.kebabcase';
import { select } from 'd3-selection';
import { zoomIdentity, zoom as Zoom } from 'd3-zoom';

const DEFAULT_VALUES = {
  kerning: '0.000',
  altBg: false,
};

const advancedControlsParams = ['kerning', 'altBg', 'altBgOpacity'];
var formWired = false;
var advancedControlsAreVisible = false;

var faviconEl = document.querySelector('link[rel~=icon]');
var dialogTextEl = document.querySelector('.dialog-text');

var fontSizeSliderEl = document.getElementById('font-size-slider');
var fontSizeLabelEl = document.getElementById('font-size-label');

var formEl = document.querySelector('.form');
var advancedControls = document.querySelectorAll('.advanced-controls');
var formExpander = document.querySelector('.form-expander');

var kerningSliderEl = document.getElementById('kerning-slider');
var kerningLabelEl = document.getElementById('kerning-label');

var downloadLinkEl = document.getElementById('download-link');

var buildButtonEl = document.getElementById('build-button');
var resultImageEl = document.getElementById('result-image');
var resultSectionEl = document.querySelector('.result');
var resultInstructionEl = document.getElementById('result-instruction');
var darkModeToggle = document.getElementById('dark-theme-toggle');
var darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
var boardEl = document.querySelector('.board');

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
  text = 'WHAT A HORRIBLE NIGHT TO HAVE A CURSE.',
  fontSize = 22,
  kerning = DEFAULT_VALUES.kerning,
  altBg = DEFAULT_VALUES.altBg,
  altBgOpacity = DEFAULT_VALUES.altBgOpacity,
}) {
  updateForm({
    text,
    fontSize,
    kerning,
  });
  renderCollage({ text, fontSize, kerning });
  wireForm({
    kerning,
    altBg,
    altBgOpacity,
  });
}

function renderCollage({ text, fontSize, kerning }) {
  dialogTextEl.style.fontSize = fontSize + 'px';
  if (text) {
    dialogTextEl.textContent = text;
  }
  if (kerning) {
    dialogTextEl.style.letterSpacing = kerning + 'em';
  } else {
    dialogTextEl.style.removeProperty('letter-spacing');
  }

  var board = select('.board');
  var zoomLayer = board.select('.zoom-layer');
  var zoom = Zoom()
    .scaleExtent([1, 8])
    .on('zoom', zoomed);
  board.call(zoom);
  board.call(zoom.transform, zoomIdentity.translate(-1100, -50));
 
  function zoomed(zoomEvent) {
    zoomLayer.attr('transform', zoomEvent.transform);
  }
}

function updateForm({ text, fontSize, kerning, }) {
  dialogTextEl.textContent = text;
  fontSizeSliderEl.value = fontSize;
  fontSizeLabelEl.textContent = fontSize;

  kerningSliderEl.value = kerning;
  kerningLabelEl.textContent = kerning;
}

function wireForm({kerning, altBg, altBgOpacity}) {
  if (formWired) {
    return;
  }

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

function onBuildClick() {
  resultSectionEl.classList.remove('hidden');
  const serializedSVG = new XMLSerializer().serializeToString(boardEl);

  const dataURI = 'data:image/svg+xml;charset=utf-8,' + serializedSVG;
  renderResult(kebabCase(dialogTextEl.textContent), dataURI);
} 

function renderResult(name, dataURL) {
  resultImageEl.src = dataURL;

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
