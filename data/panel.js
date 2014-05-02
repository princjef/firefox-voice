var classNames = {
  conversation: "contact",
  detailsView: "left-shifted",
  placeholder: "grey"
};

var ids = {
  wrap: "wrap",
  backButton: "button-back",
  messageInput: "message-input",
  conversationListing: "list"
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

var dom = {
  populateConversationListing: function(json) {
    var list = document.getElementById(ids.conversationListing);
    for (var id in json.messages) {
      var contact = document.createElement('li');

      // Classes
      contact.classList.add('contact');
      if (json.messages[id].isRead) {
        contact.classList.add('read');
      } else {
        contact.classList.add('unread');
      }

      // Data attributes
      contact.dataset.id = id;
      contact.dataset.phone = json.messages[id].displayNumber;

      // Name
      var name = document.createElement('div');
      name.classList.add('contact-name');
      name.innerHTML = "No name yet :(";
      contact.appendChild(name);

      // Phone Number
      var phoneNumber = document.createElement('div');
      phoneNumber.classList.add('small');
      phoneNumber.classList.add('grey');
      phoneNumber.innerHTML = json.messages[id].displayNumber;
      contact.appendChild(phoneNumber);

      list.appendChild(contact);
    }
  }
};

var api = {
  smsListing: function() {
    self.port.on('recentSMS', function(responseJSON) {
      dom.populateConversationListing(responseJSON);
      handlers.conversationClick();
    });
  }
};

window.onload = function() {
  handlers.backButton();
  handlers.messageInputFocus();
  api.smsListing();
};
