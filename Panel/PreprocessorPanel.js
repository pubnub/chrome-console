(function() {

  var channels = {},
    active_channel = null,
    library = {};

  library.json = {
    replacer: function(match, pIndent, pKey, pVal, pEnd) {
      var key = '<span class=json-key>';
      var val = '<span class=json-value>';
      var str = '<span class=json-string>';
      var r = pIndent || '';
      if (pKey)
         r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
      if (pVal)
         r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
      return r + (pEnd || '');
    },
    prettyPrint: function(obj) {
      var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
      return JSON.stringify(obj, null, 2)
         .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
         .replace(/</g, '&lt;').replace(/>/g, '&gt;')
         .replace(jsonLine, library.json.replacer);
    }
  };

  function start() {

    chrome.devtools.network.onRequestFinished.addListener(function(request) {

      var parser = document.createElement('a'),
        params = null,
        channel = null,
        message = null;

      parser.href = request.request.url;

      if(parser.hostname.split('.')[1] == "pubnub") {

        params = parser.pathname.split('/');

        if(params[1] == "publish") {

          channel = params[5];

          message = JSON.parse(decodeURIComponent(params[7]));
          console.log('publish to channel ' + channel + ' and message:');
          console.log(message);

          render(channel, message, 1);

        }

        if(params[1] == "subscribe") {

          request.getContent(function(body){

            channel = params[3];
            console.log('subscribe to channel ' + channel + ' and message:');

              message = JSON.parse(body)[0][0]
              console.log(message);

              render(channel, message, 2);

            });

        }

      }

    });

  }

  function render(channel, message, type) {

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
      $new_channel.classList.add('channel');

      $new_channel.addEventListener('click', function() {
        changePage(channel);
      }, false);

      $channels.appendChild($new_channel);
      $consoles.appendChild($new_console);

      if(!channels.length) {
        changePage(channel);
      }

      channels[channel] = true;

    }

    $the_console = document.querySelector('.console[data-channel="' + channel + '"]');
    $new_line.innerHTML = library.json.prettyPrint(message);

    if(type == 1) {
      $new_line.classList.add('publish');
    } else {
      $new_line.classList.add('subscribe');
    }

    $the_console.appendChild($new_line);

  }

  function changePage(channel) {

    var $consoles = document.querySelectorAll('.console'),
      $the_console = document.querySelector('.console[data-channel="' + channel + '"]'),
      $channels = document.querySelectorAll('.channels'),
      $the_channel = document.querySelector('.channel[data-channel="' + channel +'"]');

    [].forEach.call($consoles, function(el) {
      el.classList.add('hide');
    });

    [].forEach.call($channels, function(el) {
      el.classList.remove('active');
    });

    $the_console.classList.remove('hide');
    $the_console.classList.add('show');

    $the_channel.classList.add('active');

  }

  start();

})();
