// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function() {

// This function is converted to a string and becomes the preprocessor
function preprocessor(source, url, listenerName) {
  url = url ? url : '(eval)';
  url += listenerName ? '_' + listenerName : '';
  var prefix = 'window.__preprocessed = window.__preprocessed || [];\n';
  prefix += 'window.__preprocessed.push(\'' + url +'\');\n';
  var postfix = '\n//# sourceURL=' + url + '.js\n';
  return prefix + source + postfix;
}

function extractPreprocessedFiles(onExtracted) {
  var expr = 'window.__preprocessed';
  function onEval(files, isException) {
    if (isException)
      throw new Error('Eval failed for ' + expr, isException.value);
    onExtracted(files);
  }
  chrome.devtools.inspectedWindow.eval(expr, onEval);
}

function reloadWithPreprocessor(injectedScript) {
  var options = {
    ignoreCache: true,
    userAgent: undefined,
    injectedScript: '(' + injectedScript  + ')()',
    preprocessingScript: '(' + preprocessor + ')'
  };
  chrome.devtools.inspectedWindow.reload(options);
}

function demoPreprocessor() {
  function onLoaded() {
    extractPreprocessedFiles(updateUI);
  }
  var loadMonitor = new InspectedWindow.LoadMonitor(onLoaded);
  reloadWithPreprocessor(loadMonitor.injectedScript);
}

function listen() {

  var reloadButton = document.querySelector('.reload-button');
  reloadButton.addEventListener('click', demoPreprocessor);

  chrome.devtools.network.onRequestFinished.addListener(function(request) {

    var parser = document.createElement('a'),
      params = null,
      channel = null;

    parser.href = request.request.url;

    if(parser.hostname.split('.')[1] == "pubnub") {

      params = parser.pathname.split('/');

      console.log('here!')
      console.log(request)
      console.log(params)

      if(params[1] == "publish") {

        channel = params[5];
        console.log('publish to channel ' + channel + ' and message:');
        console.log(JSON.parse(decodeURIComponent(params[7])));

      }

      if(params[1] == "subscribe") {

        request.getContent(function(body){

          channel = params[3];
          console.log('subscribe to channel ' + channel + ' and message:');
            console.log(JSON.parse(body)[0][0]);
          });

      }

    }

  });

}

window.addEventListener('load', listen);

function createRow(url) {
  var li = document.createElement('li');
  li.textContent = url;
  return li;
}

function updateUI(preprocessedFiles) {
  var rowContainer = document.querySelector('.js-preprocessed-urls');
  rowContainer.innerHTML = '';
  preprocessedFiles.forEach(function(url) {
    rowContainer.appendChild(createRow(url));
  });
}

})();
