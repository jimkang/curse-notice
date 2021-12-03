import kebabCase from 'lodash.kebabcase';

const imgWidth = 512;
const imgHeight = 448;

var faviconEl = document.querySelector('link[rel~=icon]');
var downloadLinkEl = document.getElementById('download-link');
var resultImageEl = document.getElementById('result-image');
var resultSectionEl = document.querySelector('.result');
var boardEl = document.querySelector('.board');
var canvasEl = document.querySelector('.working-canvas');


export function buildImage({ text }) {
  resultSectionEl.classList.remove('hidden');
  const serializedSVG = new XMLSerializer().serializeToString(boardEl);

  const dataURI = 'data:image/svg+xml;charset=utf-8,' + serializedSVG;
  renderResult(kebabCase(text), dataURI);

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
}
