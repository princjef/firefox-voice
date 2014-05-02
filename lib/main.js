var buttons = require('sdk/ui/button/toggle');
var panels = require('sdk/panel');
// var Request = require('sdk/request').Request;
var self = require('sdk/self');
var {Cc, Ci, Cu} = require('chrome');

var url = {
  smsListing: "https://www.google.com/voice/inbox/recent/sms/"
};

var button = buttons.ToggleButton({
  id: 'firefox-voice',
  label: 'Firefox Voice',
  icon: {
    '16': './icon-16.png',
    '32': './icon-32.png',
    '64': './icon-64.png'
  },
  onChange: togglePanel
});

var panel = panels.Panel({
  contentURL: self.data.url('panel.html'),
  contentScriptFile: self.data.url('panel.js'),
  onHide: handleHide
});

panel.port.on("smsListingRequest", function() {
  get(url.smsListing, function(response) {
    console.log("Completed request");
    panel.port.emit("smsListingResponse", response);
  });
});

function togglePanel(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
  }
}

function handleHide() {
  button.state('window', { checked: false });
}

function get(url, callback) {
  var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  req.mozBackgroundRequest = true;
  req.timeout = 5000;
  req.open('GET', url, true);
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      console.log(req.responseText);
      callback(req);
    }
  };
  req.channel.QueryInterface(Ci.nsIHttpChannelInternal).forceAllowThirdPartyCookie = true;
  req.send(null);
}
