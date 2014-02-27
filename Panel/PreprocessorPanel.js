(function() {

  function listen() {

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

})();
