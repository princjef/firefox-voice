var Conversation = function(data) {
  this.id = data.id;
  this.isRead = data.isRead;
  this.timestamp = data.timestamp;
  this.relativeTime = data.relativeTime;
  this.contact = data.contact;
  this.messages = data.messages;
  this.element = null;
};

Conversation.prototype.newElement = function(rnrKey) {
  var element = document.createElement('li');

  // Classes
  element.classList.add('contact');
  if (this.isRead) {
    element.classList.add('read');
  } else {
    element.classList.add('unread');
  }

  // Data attributes
  element.dataset.id = this.id;

  // Name
  var name = document.createElement('div');
  name.classList.add('contact-name');
  name.innerHTML = this.contact.name;
  element.appendChild(name);

  // Phone Number
  var phoneNumber = document.createElement('div');
  phoneNumber.classList.add('small');
  phoneNumber.classList.add('grey');
  phoneNumber.innerHTML = this.contact.displayNumber;
  element.appendChild(phoneNumber);

  this.element = element;
  this.addClickHandler(rnrKey);

  return element;
};

Conversation.prototype.addClickHandler = function(rnrKey) {
  var that = this;
  this.element.addEventListener('click', function(event) {
    that.populateDetails();
    globals.currentConversation = that;
    if (!that.isRead) {
      that.classList.remove('unread');
      that.classList.add('read');
      self.port.emit('markRead', {
        id: that.id,
        rnrKey: rnrKey
      });
    }
    dom.switchToDetailsView();
  });
};

Conversation.prototype.populateDetails = function() {
  var detailsView = document.getElementById(ids.wrap).classList.contains(classNames.detailsView);

  if (!detailsView) {
    var list = document.getElementById(ids.messageList);
    list.innerHTML = "";

    // Name
    document.getElementById(ids.conversationDetailsName).innerHTML = this.contact.name;

    // Messages
    this.messages.forEach(function(message) {
      list.appendChild(message.newElement());
    });

    // Text Number
    document.getElementById(ids.messageInput).setAttribute("placeholder", "Send to " + this.contact.displayNumber);

    // Scroll
    var listWrap = document.getElementById(ids.messageListScroll);
    listWrap.scrollTop = listWrap.scrollHeight;
  }
};

Conversation.prototype.hasContact = function(contact) {
  return this.contact.phoneNumber === contact.phoneNumber;
};

Conversation.prototype.absorb = function(conversation) {
  var pendingMessages = conversation.messages.filter(function(message) {
    return message.isPending;
  });
  this.messages = this.messages.concat(pendingMessages);
};
