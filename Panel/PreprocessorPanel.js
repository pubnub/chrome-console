(function() {

  function listen() {

    chrome.devtools.network.onRequestFinished.addListener(function(request) {

      var parser = document.createElement('a'),
        params = null,
        channel = null,
        message = null;

      parser.href = request.request.url;

      if(parser.hostname.split('.')[1] == "pubnub") {

        params = parser.pathname.split('/');

        console.log('here!')
        console.log(request)
        console.log(params)

        if(params[1] == "publish") {

          channel = params[5];
          message = JSON.parse(decodeURIComponent(params[7]));
          console.log('publish to channel ' + channel + ' and message:');
          console.log(message);

          createRow(message);

        }

        if(params[1] == "subscribe") {

          request.getContent(function(body){

            channel = params[3];
            console.log('subscribe to channel ' + channel + ' and message:');
              message = JSON.parse(body)[0][0]
              console.log(message);

              createRow(message);

            });

        }

      }

    });

  }

  window.addEventListener('load', listen);

  function createRow(message) {

    var li = document.createElement('li'),
      rowContainer = document.querySelector('.js-preprocessed-urls');

    li.textContent = JSON.stringify(message);

    rowContainer.appendChild(li);

  }


})();
