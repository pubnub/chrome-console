(function() {

  var channels = {},
    active_channel = null;


  function start() {

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

          render(channel, message);

        }

        if(params[1] == "subscribe") {

          request.getContent(function(body){

            channel = params[3];
            console.log('subscribe to channel ' + channel + ' and message:');

              message = JSON.parse(body)[0][0]
              console.log(message);

              render(channel, message);

            });

        }

      }

    });

  }

  function render(channel, message) {

    var $new_line = document.createElement('li'),
      $channels = document.querySelector('#channels'),
      $consoles = document.querySelector('#consoles'),
      $new_channel = null
      $new_console = null,
      $the_console = null;

    if (typeof channels[channel] == 'undefined') {

      $new_console = document.createElement('ul'),
      $new_console.dataset.channel = channel;
      $new_console.classList.add('console');

      $new_channel = document.createElement('li');
      $new_channel.textContent = channel;
      $new_channel.dataset.channel = channel;

      $channels.appendChild($new_channel);
      $consoles.appendChild($new_console);

      channels[channel] = true;

    }

    $the_console = document.querySelector('.console[data-channel=' + channel + ']');
    $new_line.textContent = JSON.stringify(message);

    $the_console.appendChild($new_line);

  }

  start();

})();
