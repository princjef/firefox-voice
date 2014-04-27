var buttons = require('sdk/ui/button/toggle');
var panels = require('sdk/panel');
var self = require('sdk/self');

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
  onHide: handleHide
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
