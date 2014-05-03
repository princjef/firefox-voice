var classNames = {
  conversation: "contact",
  detailsView: "left-shifted",
  placeholder: "grey",
  gvConversation: 'gc-message',
  gvConversationRead: 'gc-message-read',
  gvConversationUnread: 'gc-message-unread',
  gvConversationPicture: 'gc-message-portrait',
  gvConversationContactName: 'gc-message-name-link',
  gvMessage: 'gc-message-sms-row',
  gvMessageFrom: 'gc-message-sms-from',
  gvMessageContent: 'gc-message-sms-text',
  gvMessageTime: 'gc-message-sms-time'
};

var ids = {
  wrap: "wrap",
  backButton: "button-back",
  messageInput: "message-input",
  conversationListing: "list",
  conversationDetailsName: "conversation-name",
  messageList: "message-list",
  messageListScroll: "message-list-wrap"
};

var url = {
  smsListing: "http://www.google.com/voice/inbox/recent/sms/"
};

var conversations = [];
var numberToText = "";
var messageInputHasText = false;

var handlers = {
  conversationClick: function() {
    var conversations = document.getElementsByClassName(classNames.conversation);
    for (var i = 0; i < conversations.length; i++) {
      conversations.item(i).addEventListener('click', function(event) {
        dom.populateConversationDetails(this.dataset.id);
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
    messageInputHasText = false;

    messageInput.addEventListener('focus', function() {
      if (!messageInputHasText) {
        this.innerHTML = "";
        this.classList.remove(classNames.placeholder);
      }
    });

    messageInput.addEventListener('blur', function() {
      if (this.innerHTML.length > 0) {
        messageInputHasText = true;
      } else {
        messageInputHasText = false;
        this.innerHTML = "Send to (123) 456-7890";
        this.classList.add(classNames.placeholder);
      }
    });
  }
};

var dom = {
  parseListingHTML: function(htmlString, jsonResponse) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, "text/html");
    var json = [];

    var conversations = doc.getElementsByClassName(classNames.gvConversation);
    for (var i = 0; i < conversations.length; i++) {
      var id = conversations[i].id;
      var conversation = {
        id: id,
        isRead: conversations[i].classList.contains(classNames.gvConversationRead),
        timestamp: jsonResponse[id].displayStartDateTime,
        relativeTime: jsonResponse[id].relativeStartTime,
        contact: {
          name: conversations[i].getElementsByClassName(classNames.gvConversationContactName)[0].innerHTML,
          displayNumber: jsonResponse[id].displayNumber,
          phoneNumber: jsonResponse[id].phoneNumber,
          imageUrl: conversations[i].getElementsByClassName(classNames.gvConversationPicture)[0].innerHTML
        },
        messages: []
      };

      var messages = conversations[i].getElementsByClassName(classNames.gvMessage);
      for (var j = 0; j < messages.length; j++) {
        var message = {
          isOutgoing: messages[j].getElementsByClassName(classNames.gvMessageFrom)[0].innerHTML.trim() === "Me:",
          content: messages[j].getElementsByClassName(classNames.gvMessageContent)[0].innerHTML,
          time: messages[j].getElementsByClassName(classNames.gvMessageTime)[0].innerHTML
        };
        conversation.messages.push(message);
      }

      json.push(conversation);
    }
    return json;
  },
  populateConversationListing: function() {
    var list = document.getElementById(ids.conversationListing);
    list.innerHTML = "";
    conversations.forEach(function(conversation) {
      var contact = document.createElement('li');

      // Classes
      contact.classList.add('contact');
      if (conversation.isRead) {
        contact.classList.add('read');
      } else {
        contact.classList.add('unread');
      }

      // Data attributes
      contact.dataset.id = conversation.id;
      contact.dataset.phone = conversation.contact.displayNumber;

      // Name
      var name = document.createElement('div');
      name.classList.add('contact-name');
      name.innerHTML = conversation.contact.name;
      contact.appendChild(name);

      // Phone Number
      var phoneNumber = document.createElement('div');
      phoneNumber.classList.add('small');
      phoneNumber.classList.add('grey');
      phoneNumber.innerHTML = conversation.contact.displayNumber;
      contact.appendChild(phoneNumber);

      list.appendChild(contact);
    });
  },
  populateConversationDetails: function(id) {
    var conversationData = {};
    conversations.forEach(function(conversation) {
      if (conversation.id === id) {
        conversationData = conversation;
      }
    });

    var list = document.getElementById(ids.messageList);
    list.innerHTML = "";

    // Name
    document.getElementById(ids.conversationDetailsName).innerHTML = conversationData.contact.name;

    // Messages
    conversationData.messages.forEach(function(message) {
      var messageHTML = document.createElement('li');

      // Classes
      messageHTML.classList.add('message');
      if (message.isOutgoing) {
        messageHTML.classList.add('message-outgoing');
      } else {
        messageHTML.classList.add('message-incoming');
      }

      // SMS Content
      var content = document.createElement('div');
      content.classList.add('message-content');
      content.innerHTML = message.content;
      messageHTML.appendChild(content);

      // SMS Time
      var time = document.createElement('div');
      time.classList.add('message-time');
      time.classList.add('grey');
      time.classList.add('small');
      time.innerHTML = message.time;
      messageHTML.appendChild(time);

      list.appendChild(messageHTML);
    });

    // Text Number
    if (!messageInputHasText) {
      document.getElementById(ids.messageInput).innerHTML = "Send to " + conversationData.contact.displayNumber;
    }

    // Scroll
    var listWrap = document.getElementById(ids.messageListScroll);
    listWrap.scrollTop = listWrap.scrollHeight;
  }
};

var api = {
  smsListing: function() {
    self.port.on('recentSMS', function(response) {
      conversations = dom.parseListingHTML(response.html, response.json);
      dom.populateConversationListing();
      handlers.conversationClick();
    });
  }
};

window.onload = function() {
  handlers.backButton();
  handlers.messageInputFocus();
  api.smsListing();
};
