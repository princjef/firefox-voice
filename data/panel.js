var classNames = {
  conversation: "contact",
  detailsView: "left-shifted",
  placeholder: "grey"
};

var ids = {
  wrap: "wrap",
  backButton: "button-back",
  messageInput: "message-input"
};

var url = {
  smsListing: "http://www.google.com/voice/inbox/recent/sms/"
}

var handlers = {
  conversationClick: function() {
    var conversations = document.getElementsByClassName(classNames.conversation);
    for (var i = 0; i < conversations.length; i++) {
      conversations.item(i).addEventListener('click', function(event) {
        document.getElementById(ids.wrap).classList.add(classNames.detailsView);
      });
    }
  },
  backButton: function() {
    document.getElementById(ids.backButton).addEventListener('click', function(event) {
      document.getElementById(ids.wrap).classList.remove(classNames.detailsView);
    });
  },
  messageInputFocus: function() {
    var messageInput = document.getElementById(ids.messageInput);
    var hasText = false;

    messageInput.addEventListener('focus', function() {
      if (!hasText) {
        this.innerHTML = "";
        this.classList.remove(classNames.placeholder);
      }
    });

    messageInput.addEventListener('blur', function() {
      if (this.innerHTML.length > 0) {
        hasText = true;
      } else {
        hasText = false;
        this.innerHTML = "Send to (123) 456-7890";
        this.classList.add(classNames.placeholder);
      }
    });
  }
};

var api = {
  smsListing: function() {
    self.port.emit('smsListingRequest');
    self.port.on('smsListingResponse', function(response) {
      console.log("Response", response.text);
    });
  }
}

window.onload = function() {
  handlers.conversationClick();
  handlers.backButton();
  handlers.messageInputFocus();
  // api.smsListing();
};
