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
const imgWidth = 512;
const imgHeight = 448;

const advancedControlsParams = ['kerning', 'altBg', 'altBgOpacity'];
var controlsWired = false;
var advancedControlsAreVisible = false;
var zoom;

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
var darkModeToggle = document.getElementById('dark-theme-toggle');
var darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
var boardEl = document.querySelector('.board');
var canvasEl = document.querySelector('.working-canvas');

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
  wireControls({
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

  var zoomContainer = select('.board');
  var zoomLayer = zoomContainer.select('.zoom-layer');
  zoom = Zoom()
    .scaleExtent([1, 32])
    .on('zoom', zoomed);
  zoomContainer.call(zoom.transform, zoomIdentity.translate(-1100, -50));
  zoomContainer.call(zoom);
 
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

function wireControls({kerning, altBg, altBgOpacity}) {
  if (controlsWired) {
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

  dialogTextEl.addEventListener('click', flagInsideDialogBox);
  document.body.addEventListener('click', unflagInsideDialogBox);

  controlsWired = true;
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
  faviconEl.href = dataURL;
  resultImageEl.addEventListener('load', drawToCanvas);
  resultImageEl.src = dataURL;

  function drawToCanvas() {
    var ctx = canvasEl.getContext('2d');
    canvasEl.width = imgWidth;
    canvasEl.height = imgHeight;
    ctx.drawImage(resultImageEl, 0, 0, imgWidth, imgHeight);
    canvasEl.toBlob(renderDownloadLink, 'image/png', 1.0);
  }

  function renderDownloadLink(blob) {
    downloadLinkEl.download = name;
    downloadLinkEl.href = window.URL.createObjectURL(blob);
  }
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

function flagInsideDialogBox(e) {
  e.stopImmediatePropagation();
  zoom.filter(() => false);
}

function unflagInsideDialogBox() {
  zoom.filter(() => true);
}

