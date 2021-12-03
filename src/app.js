import RouteState from 'route-state';
import handleError from 'handle-error-web';
import curry from 'lodash.curry';
import throttle from 'lodash.throttle';
import { buildImage } from './build-image';
import { select } from 'd3-selection';
import { zoomIdentity, zoom as Zoom } from 'd3-zoom';
import { updateForm, updateFontSizeLabel, updateKerningLabel, renderCollage,
  renderVersion, toggleAdvancedControls, renderAdvancedControls, setThemeInfo }
  from './renderers';

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
var lastTransform;

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

var throttledUpdateRouteWithZoom = throttle(updateRouteWithZoom, 500);

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
  x = -1100,
  y = -150,
  k = 1.0  
}) {
  updateForm({
    text,
    fontSize,
    kerning,
  });
  wireZoom({ x: +x, y: +y, k: +k });
  wireControls({
    kerning,
    altBg,
    altBgOpacity,
  });
  renderAdvancedControls({ ctrlState });
  renderCollage({ text: decodeURIComponent(text), fontSize, kerning });
}

function wireControls({kerning, altBg, altBgOpacity}) {
  if (controlsWired) {
    return;
  }

  fontSizeSliderEl.addEventListener(
    'input',
    curry(updateRoute)('fontSize', () => fontSizeSliderEl.value)
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

  kerningSliderEl.addEventListener('input', 
    curry(updateRoute)('kerning', () => kerningSliderEl.value)
  );
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

  dialogTextEl.addEventListener('blur', curry(updateRoute)('text', getText));

  controlsWired = true;
}

function updateRoute(prop, getVal, e) {
  e.composing;
  routeState.addToRoute({ [prop]: getVal() });
}

function updateRouteWithZoom(transform) {
  routeState.addToRoute({
    x: transform.x.toFixed(2),
    y: transform.y.toFixed(2),
    k: transform.k.toFixed(2)
  });
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

function wireZoom({ x, y, k }) {
  var zoomContainer = select('.board');
  var zoomLayer = zoomContainer.select('.zoom-layer');
  zoom = Zoom()
    .scaleExtent([1, 32])
    .on('zoom', zoomed);
  zoomContainer.call(zoom.transform, zoomIdentity.translate(x, y).scale(k));
  zoomContainer.call(zoom);
 
  function zoomed(zoomEvent) {
    zoomLayer.attr('transform', zoomEvent.transform);
    if (transformChangedEnough(zoomEvent.transform)) {
      throttledUpdateRouteWithZoom(zoomEvent.transform);
    }
    lastTransform = { x: zoomEvent.transform.x, y: zoomEvent.transform.y, k: zoomEvent.transform.k };
  }
}

function transformChangedEnough(transform) {
  if (!lastTransform) {
    return true;
  }
  return Math.abs(transform.x - lastTransform.x) > 0.1 ||
    Math.abs(transform.y - lastTransform.y) > 0.1 ||
    Math.abs(transform.k - lastTransform.k) > 0.1;
}
 
function flagInsideDialogBox(e) {
  e.stopImmediatePropagation();
  zoom.filter(() => false);
}

function unflagInsideDialogBox() {
  zoom.filter(() => true);
}

function getText() {
  // innerText keeps line breaks. textContent doesn't.
  return encodeURIComponent(dialogTextEl.innerText);
}

