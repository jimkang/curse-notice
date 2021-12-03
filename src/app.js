import RouteState from 'route-state';
import handleError from 'handle-error-web';
import curry from 'lodash.curry';
import { buildImage } from './build-image';
import { select } from 'd3-selection';
import { zoomIdentity, zoom as Zoom } from 'd3-zoom';
import { updateForm, updateFontSizeLabel, updateKerningLabel, renderCollage,
  renderVersion, toggleAdvancedControls, setThemeInfo } from './renderers';

const DEFAULT_VALUES = {
  kerning: '0.000',
  altBg: false,
};

const advancedControlsParams = ['kerning', 'altBg', 'altBgOpacity'];
var controlsWired = false;
var ctrlState = {
  advancedControlsAreVisible: false
};
var zoom;

var dialogTextEl = document.querySelector('.dialog-text');
var fontSizeSliderEl = document.getElementById('font-size-slider');
var formEl = document.querySelector('.form');
var advancedControls = document.querySelectorAll('.advanced-controls');
var formExpander = document.querySelector('.form-expander');

var kerningSliderEl = document.getElementById('kerning-slider');

var buildButtonEl = document.getElementById('build-button');
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
  wireZoom();
  wireControls({
    kerning,
    altBg,
    altBgOpacity,
  });
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

  ctrlState.advancedControlsAreVisible = areAdvancedControlsModified({
    kerning, altBg, altBgOpacity
  });
  formEl.classList.toggle('expanded', ctrlState.advancedControlsAreVisible);
  advancedControls.forEach(
    ({classList}) => classList.toggle('hidden', !ctrlState.advancedControlsAreVisible)
  );
  
  formExpander.classList.toggle('hidden', false);
  
  formExpander.addEventListener('mouseenter', () => {
    formEl.classList.toggle('highlighted', true);
  });
  
  formExpander.addEventListener('mouseleave', () => {
    formEl.classList.toggle('highlighted', false);
  });
  
  formExpander.addEventListener('click', () => toggleAdvancedControls({ ctrlState }));

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

function onBuildClick() {
  buildImage({ text: dialogTextEl.textContent });
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}

function areAdvancedControlsModified (controlValues) {
  return advancedControlsParams.some((param) => DEFAULT_VALUES[param] !== controlValues[param]);
}

function wireZoom() {
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

function flagInsideDialogBox(e) {
  e.stopImmediatePropagation();
  zoom.filter(() => false);
}

function unflagInsideDialogBox() {
  zoom.filter(() => true);
}

