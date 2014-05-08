var typeahead = {
  openDialog: function() {
    document.getElementById(ids.newConversationButton).addEventListener('click', function() {
      console.log("Clicked new conversation button");
      globals.findingContact = !globals.findingContact;
      document.getElementById(ids.wrap).classList.toggle("find-contact");
      document.getElementById(ids.newConversationInput).focus();
    });
  },
  setSelection: function(element) {
    var contactId = element.dataset.contactId;
    var key = "";
    for (var id in globals.conversations) {
      if (globals.conversations[id].contact.phoneNumber === element.dataset.phoneNumber) {
        key = id;
        break;
      }
    }

    if (key === "") {
      globals.conversations[""] = {
        id: "",
        isRead: true,
        timestamp: "",
        relativeTime: "",
        contact: {
          name: element.dataset.name,
          displayNumber: element.dataset.displayNumber,
          phoneNumber: element.dataset.phoneNumber,
          imageUrl: ""
        },
        messages: []
      };
    }

    this.hide();
    dom.populateConversationDetails(key);
    document.getElementById(ids.wrap).classList.add(classNames.detailsView);
  },
  populate: function() {
    var typeaheadElement = document.getElementById(ids.contactTypeahead);
    typeaheadElement.innerHTML = "";

    globals.user.rankedContacts.forEach(function(contactId) {
      var contactInfo = globals.user.contacts[contactId];
      var contact = document.createElement('li');
      contact.classList.add('typeahead-element');
      contact.classList.add('visible');
      contact.dataset.contactId = contactInfo.contactId;
      contact.dataset.phoneNumber = contactInfo.phoneNumber;
      contact.dataset.displayNumber = contactInfo.displayNumber;
      contact.dataset.name = contactInfo.name;

      var name = document.createElement('span');
      name.innerHTML = contactInfo.name + " ";
      contact.appendChild(name);

      var phone = document.createElement('span');
      phone.classList.add('grey');
      phone.innerHTML = contactInfo.displayNumber;
      contact.appendChild(phone);

      typeaheadElement.appendChild(contact);
    });

    typeahead.mouseEvents();
  },
  inputChange: function() {
    var contactInput = document.getElementById(ids.newConversationInput);
    var typeaheadContacts = document.getElementsByClassName(classNames.contactTypeaheadElement);

    var updateTypeahead = function() {
      window.setTimeout(function() {
        var value = contactInput.value.toLowerCase();
        if (value !== globals.oldContactInputValue) {
          globals.oldContactInputValue = value;
          var numValue = value.replace(/\.|-|\s/g, "");
          var firstElement = true;

          for (var i = 0; i < typeaheadContacts.length; i++) {
            var contact = typeaheadContacts.item(i);
            if (contact.dataset.name.toLowerCase().contains(value) ||
                contact.dataset.phoneNumber.contains(numValue) ||
                contact.dataset.displayNumber.contains(value)
            ) {
              contact.classList.remove('hidden');
              contact.classList.add('visible');
              if (firstElement) {
                contact.classList.add('selected');
                firstElement = false;
              } else {
                contact.classList.remove('selected');
              }
            } else {
              contact.classList.add('hidden');
              contact.classList.remove('visible');
              contact.classList.remove('selected');
            }
          }
        }
      }, 0);
    };

    contactInput.addEventListener('change', updateTypeahead);
    contactInput.addEventListener('cut', updateTypeahead);
    contactInput.addEventListener('paste', updateTypeahead);
    contactInput.addEventListener('drop', updateTypeahead);
    contactInput.addEventListener('keydown', updateTypeahead);
  },
  keyEvents: function() {
    document.getElementById(ids.newConversationInput).addEventListener('keydown', function(event) {
      var getSelectedIndex = function(elements) {
        for (var i = 0; i < elements.length; i++) {
          if (elements.item(i).classList.contains('selected')) {
            return i;
          }
        }
        return null;
      };

      var selectedElement = null;

      if (event.keyCode === 38 || event.keyCode === 40) {  // Up/down Arrow
        var visibleElements = document.querySelectorAll('.typeahead-element.visible');
        var index = getSelectedIndex(visibleElements);
        if (index !== null) {
          visibleElements.item(index).classList.remove('selected');
        }

        var newIndex;
        if (event.keyCode === 38) {  // Up arrow
          newIndex = ((index === null || index <= 0) ? (visibleElements.length - 1) : (index - 1));
        } else {  // Down arrow
          newIndex = ((index === null || index >= visibleElements.length - 1) ? 0 : (index + 1));
        }

        visibleElements.item(newIndex).classList.add('selected');
        selectedElement = visibleElements.item(newIndex);
        event.stopPropagation();
        event.preventDefault();

      } else if (event.keyCode === 13) { // Enter
        var selectedElement = document.querySelectorAll('.typeahead-element.visible.selected')[0];
        typeahead.setSelection(selectedElement);
      }

      if (selectedElement !== null) {
        var typeaheadElement = document.getElementById(ids.contactTypeaheadWrap);
        // console.log("OutScroll", typeahead.scrollTop, "OutHeight", typeahead.offsetHeight, "InScroll", selectedElement.offsetTop, "InHeight", selectedElement.offsetHeight);
        if (selectedElement.offsetTop < typeaheadElement.scrollTop) {
          var scroll = selectedElement.offsetTop;
          typeaheadElement.scrollTop = scroll;
        } else if (selectedElement.offsetTop + selectedElement.offsetHeight > typeaheadElement.scrollTop + typeaheadElement.offsetHeight) {
          var scroll = (selectedElement.offsetTop + selectedElement.offsetHeight - typeaheadElement.offsetHeight);
          typeaheadElement.scrollTop = scroll;
        }
      }
    });
  },
  mouseEvents: function() {
    var typeaheadElements = document.getElementsByClassName(classNames.contactTypeaheadElement);

    // console.log("Typeahead Elements Length", typeaheadElements.length);
    for (var i = 0; i < typeaheadElements.length; i++) {
      typeaheadElements.item(i).addEventListener('mouseenter', function(event) {
        for (var j = 0; j < typeaheadElements.length; j++) {
          typeaheadElements.item(j).classList.remove('selected');
        }
        this.classList.add('selected');
      });

      typeaheadElements.item(i).addEventListener('click', function(event) {
        typeahead.setSelection(this);
      });
    }
  },
  hide: function() {
    var wrap = document.getElementById(ids.wrap);
    if (wrap.classList.contains("find-contact")) {
      wrap.classList.remove("find-contact");
      document.getElementById(ids.newConversationInput).value = "";
      return true;
    } else {
      return false;
    }
  }
};
