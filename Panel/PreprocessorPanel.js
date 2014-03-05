(function() {

  var channels = {},
    library = {},
    subscribe_key = null;

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

  function render(channel, message, type, is_history) {

    if(typeof message !== "undefined") {

     var
       is_history = is_history || false,
       $new_line = document.createElement('li'),
       $channels = document.querySelector('#channels'),
       $consoles = document.querySelector('#consoles'),
       $new_channel = null
       $new_console = null,
       $the_console = null;

     console.log(channel)
     console.log(channels)

     if (typeof channels[channel] == 'undefined') {

       $new_console = document.createElement('ul');
       $new_console.classList.add('lines');

       $history = document.createElement('div');
       $history.classList.add('load-history');
       $history.innerHTML = "&#9650; Load Message History";

       $history.addEventListener('click', function(e) {
         load_history(channel);
         e.target.classList.add('hide');
       });

       $new_console_wrapper = document.createElement('div');
       $new_console_wrapper.classList.add('console');
       $new_console_wrapper.dataset.channel = channel;

       $new_console_wrapper.appendChild($history);
       $new_console_wrapper.appendChild($new_console);

       $new_channel = document.createElement('li');
       $new_channel.textContent = channel;
       $new_channel.dataset.channel = channel;
       $new_channel.classList.add('channel');

       $new_channel.addEventListener('click', function() {
         changePage(channel);
       }, false);

       $channels.appendChild($new_channel);
       $consoles.appendChild($new_console_wrapper);

       if(!channels.length) {
         changePage(channel);
       }

       channels[channel] = true;

     }

     $the_console = document.querySelector('.console[data-channel="' + channel + '"] .lines');
     $new_line.innerHTML = library.json.prettyPrint(message);

     if(is_history) {

       $new_line.classList.add('history');

       $the_console.insertBefore($new_line, $the_console.firstChild);

     } else {

       if(type == 1) {
         $new_line.classList.add('publish');
       } else {
         $new_line.classList.add('subscribe');
       }

       $the_console.appendChild($new_line);

     }

    }

  }

  function changePage(channel) {

    var $consoles = document.querySelectorAll('.console'),
      $the_console = document.querySelector('.console[data-channel="' + channel + '"]'),
      $channels = document.querySelectorAll('.channel'),
      $the_channel = document.querySelector('.channel[data-channel="' + channel +'"]');

    [].forEach.call($consoles, function(el) {
      el.classList.remove('show');
      el.classList.add('hide');
    });

    [].forEach.call($channels, function(el) {
      el.classList.remove('active');
    });

    $the_console.classList.remove('hide');
    $the_console.classList.add('show');

    $the_channel.classList.add('active');

  }

  function load_history(channel) {

    pubnub.history({
      channel: channel,
      callback: function(history){

        history[0].reverse();

        for(var i = 0; i < history[0].length; i++) {
          render(channel, history[0][i], 0, true);
        }

      },
    });

  }

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

          channel = decodeURIComponent(params[5]);

          message = JSON.parse(decodeURIComponent(params[7]));
          console.log('publish to channel ' + channel + ' and message:');
          console.log(message);

          render(channel, message, 1);

        }

        if(params[1] == "subscribe") {

          if(!subscribe_key) {

            subscribe_key = params[2];

            pubnub = PUBNUB.init({
              publish_key: subscribe_key,
            });

          }

          request.getContent(function(body){

            console.log('subscribe to channel ' + channel + ' and message:');

              parsed = JSON.parse(body);

              console.log('parsed message is');
              console.log(parsed);

              if(typeof parsed !== "undefined") {
                message = parsed[0][0];
              }

              render(parsed[2], message, 2);

            });

        }

      }

    });

  }

  start();

})();
