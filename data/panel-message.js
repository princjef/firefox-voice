var Message = function(data, pending) {
  this.isOutgoing = data.isOutgoing;
  this.isPending = pending;
  this.content = data.content;
  this.time = data.time;
  this.element = null;
};

Message.prototype.newElement = function() {
  var element = document.createElement('li');
  element.classList.add('message');
  if (this.isOutgoing) {
    element.classList.add('message-outgoing');
  } else {
    element.classList.add('message-incoming');
  }

  if (this.isPending) {
    element.classList.add('message-pending');
  }

  var content = document.createElement('div');
  content.classList.add('message-content');
  content.innerHTML = this.content;
  element.appendChild(content);

  var time = document.createElement('div');
  time.classList.add('message-time');
  time.classList.add('grey');
  time.classList.add('small');
  time.innerHTML = (this.isPending ? "Sending" : this.time);
  element.appendChild(time);

  this.element = element;
  return element;
};

Message.prototype.sent = function(success) {
  var time = this.element.getElementsByClassName('message-time')[0];
  if (success) {
    this.element.classList.remove('message-pending');
    this.isPending = true;

    // Set time
    var d = new Date();
    var AMPM = d.getHours() >= 12 ? "PM" : "AM";
    var hour = d.getHours() % 12;
    if (hour === 0) hour = 12;
    this.time = "" + hour + ":" + d.getMinutes() + " " + AMPM;
    time.innerHTML = this.time;
  } else {
    time.innerHTML = "Failed to send";
  }
};
