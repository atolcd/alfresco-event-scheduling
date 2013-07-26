/*
 * Copyright (C) 2012 Atol Conseils et Développements.
 * http://www.atolcd.com/
 * Author: Bertrand FOREST
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Dashboard Events component.
 *
 * @namespace Alfresco
 * @class Alfresco.module.CreateOrEditEventScheduling
 */
(function ()
{
  /**
   * YUI Library aliases
   */
  var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      KeyListener = YAHOO.util.KeyListener,
      toISO8601 = Alfresco.util.toISO8601,
      formatDate = Alfresco.util.formatDate;

  /**
   * Alfresco Slingshot aliases
   */
  var $html = Alfresco.util.encodeHTML,
      $combine = Alfresco.util.combinePaths;

  // Constants
  var CREATE_OR_EDIT_EVENT_DIALOG_WIDTH_EM = 46,
      AUTHORITY_FINDER_PANEL_WIDTH_EM = 40;

  /**
   * Dashboard CreateOrEditEvent constructor.
   *
   * @param {String} htmlId The HTML id of the parent element
   * @return {Alfresco.module.CreateOrEditEventScheduling} The new component instance
   * @constructor
   */
  Alfresco.module.CreateOrEditEventScheduling = function CreateOrEditEventScheduling_constructor(htmlId) {
    // Remove this instance of this component before a new one is created
    Alfresco.util.ComponentManager.unregister(Alfresco.util.ComponentManager.findFirst("Alfresco.module.CreateOrEditEventScheduling"));

    Alfresco.module.CreateOrEditEventScheduling.superclass.constructor.call(this, "Alfresco.module.CreateOrEditEventScheduling", htmlId + "-createOrEditEventDialog", ["calendar", "event-simulate"]);

    // Authority listener
    YAHOO.Bubbling.subscribe("itemSelected", this.onAuthoritySelected, this);

    this.init();
    return this;
  };

  /**
   * Extend from Alfresco.component.Base and add class implementation
   */
  YAHOO.extend(Alfresco.module.CreateOrEditEventScheduling, Alfresco.component.Base, {
    /**
     * Object container for initialization options
     *
     * @property options
     * @type object
     */
    options: {
      /**
       * Site id
       *
       * @property siteId
       * @type string
       * @default null
       */
      siteId: null,

      /**
       * Event nodeRef
       *
       * @property nodeRef
       * @type string
       * @default null
       */
      nodeRef: null,

      /**
       * Dialog mode (view, edit, create) ?
       *
       * @property mode
       * @type string
       * @default create
       */
      mode: "create"
    },

    showingAuthorityFinder: false,

    authorities: {},

    calendars: {},

    calendarMenus: {},

    lastTabIndex: 0,

    eventDialog: null,

    form: null,

    /**
     * Fired by YUI when parent element is available for scripting
     * @method onReady
     */
    init: function CreateOrEditEventScheduling_init() {
      var doBeforeDialogShow = function(p_form, p_dialog) {
        this.eventDialog.dialog.hideEvent.subscribe(this.onHideEvent, null, this);

        // Visibility select handler
        YAHOO.util.Event.addListener(Dom.get(this.id + '-visibility'), "change", this.onCreateOrEditEventDialogVisibilityChange, this);

        /** Authority-Finder **/
        // Load the Authority Finder component
        Alfresco.util.Ajax.request({
          url: Alfresco.constants.URL_SERVICECONTEXT + "components/people-finder/authority-finder",
          dataObj: {
             htmlid: this.id + "-authorityFinder"
          },
          successCallback: {
             fn: this.onAuthorityFinderLoaded,
             scope: this
          },
          failureMessage: this.msg("message.authorityFinderFail"),
          execScripts: true
        });

        /** Date pickers **/
        if (this.options.mode == "view") {
          Dom.addClass(this.id + "-add-date", "hidden");
        } else {
          // Validity picker
          this.addDatePicker("validityDate", true, 4);

          // Schedules pickers
          this.widgets.addDate = Alfresco.util.createYUIButton(this, "add-date", this.onAddDateClick, {});
          if (this.options.mode == "create") {
            this.addDatePicker("date0", false, this._getNewTabIndex() - 1);
          }
        }

        // Hook action events
        var me = this;
        var fnActionHandler = function fnActionHandler(layer, args) {
          var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "span");
          if (owner !== null) {
            if (typeof me[owner.className] == "function") {
              args[1].stop = true;
              me[owner.className].call(me, owner.getAttribute('name'), owner);
            }
          }
          return true;
        };
        YAHOO.Bubbling.addDefaultAction("remove-item-link", fnActionHandler, true);
      };

      var doSetupFormsValidation = function(p_form) {
        p_form.addValidation(this.id + "-title", Alfresco.forms.validation.mandatory, null, "keyup");
        p_form.addValidation(this.id + "-date0", Alfresco.forms.validation.mandatory, null, "keypress");

        // Only if private
        if (Dom.get(this.id + "-visibility").value == "private") {
          p_form.addValidation(this.id + "-authorities", Alfresco.forms.validation.mandatory, null, "keypress");
        }

        p_form.setShowSubmitStateDynamically(true, false);
        this.form = p_form;
      };

      this.eventDialog = new Alfresco.module.SimpleDialog(this.id).setOptions({
        width: CREATE_OR_EDIT_EVENT_DIALOG_WIDTH_EM + "em",
        actionUrl: Alfresco.constants.PROXY_URI + "slingshot/dashlets/schedule-event",
        templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "modules/event-scheduling/schedule-event?submitType=json",
        destroyOnHide: true,
        firstFocus: this.id + "-title",
        doBeforeDialogShow: {
          fn: doBeforeDialogShow,
          scope: this
        },
        doSetupFormsValidation: {
          fn: doSetupFormsValidation,
          scope: this
        },
        onSuccess: {
          fn: function (response) {
            this.eventDialog.dialog.hide();

            // Fire the 'refreshScheduledEvents' event
            YAHOO.Bubbling.fire("refreshScheduledEvents", {});

            Alfresco.util.PopupManager.displayMessage({
              text: this.msg(this.options.mode + ".message.success")
            });
          },
          scope: this
        },
        onFailure: {
          fn: function (response) {
            Alfresco.util.PopupManager.displayMessage({
              text: this.msg(this.options.mode + ".message.failure")
            });
          },
          scope: this
        }
      });

      // @override _showDialog method
      this.eventDialog._showDialog = function _showDialog() {
        // Do not hide dialog after submit
        this.dialog.cfg.setProperty("hideaftersubmit", false);

        var form = Dom.get(this.id + "-form");

        // Make sure forms without Share-specific templates render roughly ok
        Dom.addClass(form, "bd");

        // Custom forms validation setup interest registered?
        var doSetupFormsValidation = this.options.doSetupFormsValidation;
        if (typeof doSetupFormsValidation.fn == "function") {
          doSetupFormsValidation.fn.call(doSetupFormsValidation.scope || this, this.form, doSetupFormsValidation.obj);
        }

        // Custom forms before-submit interest registered?
        var doBeforeFormSubmit = this.options.doBeforeFormSubmit;
        if (typeof doBeforeFormSubmit.fn == "function") {
          this.form.doBeforeFormSubmit = doBeforeFormSubmit;
        } else {
          // If no specific handler disable buttons before submit to avoid double submits
          this.form.doBeforeFormSubmit = {
            fn: function AmSD__defaultDoBeforeSubmit() {
              this.widgets.okButton.set("disabled", true);
              this.widgets.cancelButton.set("disabled", true);
            },
            scope: this
          };
        }

        // Custom ajax before-request interest registered?
        var doBeforeAjaxRequest = this.options.doBeforeAjaxRequest;
        if (typeof doBeforeAjaxRequest.fn == "function") {
          this.form.doBeforeAjaxRequest = doBeforeAjaxRequest;
        }

        if (this.options.actionUrl !== null) {
          form.attributes.action.value = this.options.actionUrl;
        }

        if (this.options.clearForm) {
          var inputs = Selector.query("input", form),
              input;
          inputs = inputs.concat(Selector.query("textarea", form));
          for (var i = 0, j = inputs.length; i < j; i++) {
            input = inputs[i];
            if(input.getAttribute("type") != "radio" && input.getAttribute("type") != "checkbox" && input.getAttribute("type") != "hidden") {
              input.value = "";
            }
          }
        }
        // Custom before show event interest registered?
        var doBeforeDialogShow = this.options.doBeforeDialogShow;
        if (doBeforeDialogShow && typeof doBeforeDialogShow.fn == "function") {
          doBeforeDialogShow.fn.call(doBeforeDialogShow.scope || this, this.form, this, doBeforeDialogShow.obj);
        }

        // Make sure ok button is in the correct state if dialog is reused
        if (this.isFormOwner) {
          this.widgets.okButton.set("disabled", false);
          this.widgets.cancelButton.set("disabled", false);
        }
        this.form.updateSubmitElements();

        this.dialog.show();

        // Fix Firefox caret issue
        Alfresco.util.caretFix(form);

        // We're in a popup, so need the tabbing fix
        this.form.applyTabFix();

        // Set focus if required
        if (this.options.firstFocus !== null) {
          Dom.get(this.options.firstFocus).focus();
        }
      };
    },

    /**
     * Show dialog
     * @method show
     */
    show: function CreateOrEditEventScheduling_show() {
      this.eventDialog.setOptions({
        templateRequestParams: {
          nodeRef: (this.options.nodeRef) ? this.options.nodeRef : "",
          siteId: this.options.siteId || "",
          mode: this.options.mode
        }
      }).show();
    },

    onHideEvent: function CreateOrEditEventScheduling_onHideEvent(e, obj) {
      YAHOO.Bubbling.unsubscribe("itemSelected", this.onAuthoritySelected, this);

      // Remove and clear 'AuthorityFinder' component
      Alfresco.util.ComponentManager.unregister(Alfresco.util.ComponentManager.findFirst("Alfresco.AuthorityFinder"));
      this.modules.authorityFinder.unsubscribeItemSelectedEvent();
      this.modules.authorityFinder.clearResults();
      this.modules.authorityFinder.destroy();
    },

    /**
     * Event handler on date selection
     * @method onDateSelectButton
     * @param e {object} Event
     * @param args {string} Date id
     */
    onDateSelectButton: function CreateOrEditEventScheduling_onDateSelectButton(e, args) {
      if (e) { Event.stopEvent(e); }

      var targetEl = Event.getTarget(e),
          dateId = args[0],
          showBottom = args[1],
          domEl = Dom.get(this.id + '-' + dateId),
          calendarMenuId = "calendarmenu-" + dateId;

      if (!this.calendarMenus[calendarMenuId]) {
        this.calendarMenus[calendarMenuId] = new YAHOO.widget.Overlay(calendarMenuId, {
          context: [targetEl, 'tl', 'bl']
        });
      }

      Dom.addClass(this.calendarMenus[calendarMenuId].element, "calendarmenu");

      this.calendarMenus[calendarMenuId].setBody("&#32;");
      this.calendarMenus[calendarMenuId].body.id = "calendarcontainer-" + dateId;
      Dom.addClass(this.calendarMenus[calendarMenuId].body, "calendarcontainer");

      this.calendarMenus[calendarMenuId].render(Dom.getAncestorByTagName(targetEl.id, 'div'));

      var d =  Alfresco.CalendarHelper.getDateFromField(domEl) || new Date();
      var pagedate = Alfresco.CalendarHelper.padZeros(d.getMonth() + 1) + '/' + d.getFullYear();
      var options = {
        pagedate: pagedate,
        selected: formatDate(d, "mm/dd/yyyy"), // MM/DD/YYYY
        close: true
      };

      if (!this.calendars[dateId]) {
        this.calendars[dateId] = new YAHOO.widget.Calendar("buttoncalendar-" + dateId, this.calendarMenus[calendarMenuId].body.id, options);
      }
      Alfresco.util.calI18nParams(this.calendars[dateId]);
      this.calendars[dateId].render();

      var fn = function(type, args, obj) {
        var date,
            me = obj[0];
            dateId = obj[1];
        if (args) {
          date = args[0][0];
          var selectedDate = new Date(date[0], (date[1] - 1), date[2]);
          Alfresco.CalendarHelper.writeDateToField(selectedDate, domEl);

          var toDate = Alfresco.CalendarHelper.getDateFromField(domEl);
              document.getElementsByName(dateId + '-iso')[0].value = toISO8601(toDate);

          var input = Dom.get(me.id + "-" + dateId);
          if (input) {
            // Simulate "keypress" event
            YAHOO.util.UserAction.keypress(input);
          }
        }
        me.calendarMenus["calendarmenu-" + dateId].hide();
      };
      this.calendars[dateId].selectEvent.subscribe(fn, [this, dateId]);

      this.calendarMenus[calendarMenuId].body.tabIndex = -1;
      this.calendars[dateId].oDomContainer.tabIndex = -1;
      this.calendarMenus[calendarMenuId].show();
      this.calendars[dateId].show();
      this.calendarMenus[calendarMenuId].body.focus();

      if (!showBottom) {
        this.calendarMenus[calendarMenuId].align("bl", "tl");
      }

      return false;
    },

    /**
     * Add date picker on a field
     * @method addDatePicker
     * @param dateId {string} Field id
     * @param tabindex {integer} tabindex
     */
    addDatePicker: function CreateOrEditEventScheduling_addDatePicker(fieldId, showBottom, tabindex) {
      var datePicker = new YAHOO.widget.Button({
        type: "link",
        id: "calendarpicker-" + fieldId,
        label: '',
        href: '',
        tabindex: (tabindex) ? tabindex : this._getNewTabIndex(),
        container: this.id + "-container-" + fieldId
      });
      datePicker.addClass("calendarpicker");
      datePicker.addClass("hasTabIndex");

      datePicker.on("click", this.onDateSelectButton, [fieldId, showBottom], this);
      Event.on(Dom.get(this.id + "-" + fieldId), "click", this.onDateSelectButton, [fieldId, showBottom], this);

      var buttonKeypressHandler = function() {
        return function(e) {
          if (e.keyCode === KeyListener.KEY.ENTER || e.keyCode === KeyListener.KEY.SPACE || e.keyCode === 0) {
            this.onDateSelectButton.apply(this, arguments);
            return false;
          }
        };
      }();
      datePicker.on("keypress", buttonKeypressHandler, [fieldId, showBottom], this);
    },

    /**
     * Event handler on "add-date" button
     * @method onAddDateClick
     * @param e {object} Event
     * @param button {YUIButton} Button element
     */
    onAddDateClick: function CreateOrEditEventScheduling_onAddDateClick(e, button) {
      var dateindex = 1;

      var datesContainerEl = Dom.get(this.id + "-dates-container");
      var datesEl = YAHOO.util.Selector.query('div.date', datesContainerEl);
      if (datesEl.length > 1) {
        var lastEl = datesEl[datesEl.length -1];

        var el = YAHOO.util.Selector.query('input[type=text].datepicker-date', lastEl, true);
        dateindex = parseInt(el.getAttribute("name").substr(4), 10) + 1;
      }

      var dateId = "date" + dateindex,
          datetimeId = "datetime" + dateindex;

      var dateContainer = document.createElement('div');
      dateContainer.innerHTML = '<span id="' + this.id + '-container-' + dateId + '">' +
                                  '<label for="' + this.id + '-' + dateId + '" class="inline-label">' + this.msg("label.date") + ':&nbsp;&nbsp;</label>\n' +
                                  '<input id="' + this.id + '-' + dateId + '" type="text" name="' + dateId + '" readonly="readonly" value="" title="" class="datepicker-date" />\n' +
                                  '<input id="' + this.id + '-' + dateId + '-iso" type="hidden" name="' + dateId + '-iso" value="" />' +
                                '</span>\n';
      Dom.addClass(dateContainer, "date yui-gd");
      datesContainerEl.appendChild(dateContainer);

      this.addDatePicker(dateId);

      var datetimeEl = document.createElement('span');
      datetimeEl.setAttribute("id", this.id + '-container-' + datetimeId);
      datetimeEl.innerHTML = '<label for="' + this.id + '-' + datetimeId + '" class="inline-label">' + this.msg("label.at") + '</label>\n' +
                             '<input id="' + this.id + '-' + datetimeId + '" name="' + datetimeId + '" tabIndex="' + this._getNewTabIndex() + '" value="" type="text" size="10" class="datepicker-time" />';
      dateContainer.appendChild(datetimeEl);

      // Center dialog
      this.eventDialog.dialog.center();
    },

    /**
     * Event handler on visibility change
     * @method onCreateOrEditEventDialogVisibilityChange
     * @param e {object} Event
     * @param me {object} This
     */
    onCreateOrEditEventDialogVisibilityChange: function CreateOrEditEventScheduling_onCreateOrEditEventDialogVisibilityChange(e, me) {
      var selectedValue = this.options[this.selectedIndex].value;
      if (selectedValue == "public") {
        Dom.addClass(me.id + "-private-options", "hidden");
        me._removeFormValidation(me.id + "-authorities");
      } else {
        Dom.removeClass(me.id + "-private-options", "hidden");
        me.form.addValidation(me.id + "-authorities", Alfresco.forms.validation.mandatory, null, "keypress");
        me.form.updateSubmitElements();
      }

      // Center dialog
      me.eventDialog.dialog.center();
    },

    /**
     * Event handler on "add-user-group" button
     * @method onAddUserGroupButton
     * @param e {object} Event
     * @param button {YUIButton} Button element
     */
    onAddUserGroupButton: function CreateOrEditEventScheduling_onAddUserGroupButton(e, button) {
      button.set("label", button.get("checked") ? this.msg('button.hide') : this.msg('button.add-user-group'));

      if (!this.showingAuthorityFinder) {
        this.eventDialog.dialog.cfg.setProperty("width", (CREATE_OR_EDIT_EVENT_DIALOG_WIDTH_EM + AUTHORITY_FINDER_PANEL_WIDTH_EM) + "em");

        Dom.addClass(this.widgets.authorityFinder, "active");
        Dom.get(this.id + "-authorityFinder-search-text").focus();
        this.showingAuthorityFinder = true;
      } else {
        this.eventDialog.dialog.cfg.setProperty("width", CREATE_OR_EDIT_EVENT_DIALOG_WIDTH_EM + "em");
        Dom.removeClass(this.widgets.authorityFinder, "active");
        this.showingAuthorityFinder = false;
      }

      // Center dialog
      this.eventDialog.dialog.center();
    },

    /**
     * Event handler on authority finder load
     * @method onAuthorityFinderLoaded
     * @param response {object} JSON response
     */
    onAuthorityFinderLoaded: function CreateOrEditEventScheduling_onAuthorityFinderLoaded(response) {
      // Inject the component from the XHR request into it's placeholder DIV element
      var finderDiv = Dom.get(this.id + "-authorityFinder");
      if (finderDiv) {
        finderDiv.innerHTML = response.serverResponse.responseText;
        this.widgets.authorityFinder = finderDiv;

        // Find the Authority Finder by container ID
        this.modules.authorityFinder = Alfresco.util.ComponentManager.get(this.id + "-authorityFinder");

        // Set the correct options for our use
        this.modules.authorityFinder.setOptions({
          dataWebScript: Alfresco.constants.URL_SERVICECONTEXT + "components/event-scheduling/authority-finder/authority-query?sortBy=sortField" + ((this.options.siteId) ? "&zone=APP.SHARE&site=" + this.options.siteId : "&ignoreGuest=true"),
          authorityType: Alfresco.AuthorityFinder.AUTHORITY_TYPE_ALL,
          viewMode: Alfresco.AuthorityFinder.VIEW_MODE_COMPACT,
          singleSelectMode: false,
          minSearchTermLength: 1
        });

        this.modules.authorityFinder.unsubscribeItemSelectedEvent = function() {
          YAHOO.Bubbling.unsubscribe("itemSelected", this.onItemSelected, this);
        };

        // Add already selected items
        var alreadySelectedItems = Dom.get(this.id + "-authorities").value;
        if (alreadySelectedItems) {
          var items = alreadySelectedItems.split(',');
          for (var i=0, ii=items.length ; i<ii ; i++) {
            this.modules.authorityFinder.selectedItems[items[i]] = true;
          }
        }

        // Add User/Group button
        if (this.options.mode == "view") {
          Dom.addClass(this.id + "-addUserGroupButton", "hidden");
        } else {
          this.widgets.addUserGroup = Alfresco.util.createYUIButton(this, "addUserGroupButton", this.onAddUserGroupButton, {
            type: "checkbox",
            checked: false
          });
        }
      }
    },

    /**
     * Event handler on authority selected
     * @method onAuthoritySelected
     * @param e {object} Event
     * @param args {object} Authority selected
     */
    onAuthoritySelected: function CreateOrEditEventScheduling_onAuthoritySelected(e, args) {
      // Construct permission descriptor and add permission row.
      var authorityName = args[1].itemName;
      if (!this.modules.authorityFinder.selectedItems[authorityName]) {
        // Authority selected DOM element
        var authorityEl = document.createElement("div");
        authorityEl.setAttribute('id', this.id + '-' + authorityName);
        Dom.addClass(authorityEl, "authority " + ((authorityName.toUpperCase().indexOf("GROUP_") != -1) ? "group" : "user"));
        authorityEl.innerHTML = args[1].displayName;

        // Remove authority DOM element
        var removeAuthorityEl = document.createElement("span");
        removeAuthorityEl.setAttribute('class', 'onAuthorityRemoved');
        removeAuthorityEl.setAttribute('name', authorityName);
        removeAuthorityEl.innerHTML = '<a title="' + this.msg('button.remove') + '" class="remove-item-link" href="#"><span class="removeIcon">&nbsp;</span></a>';

        authorityEl.appendChild(removeAuthorityEl);
        Dom.get(this.id + "-authorities-selected").appendChild(authorityEl);

        // Update input
        this.updateAuthoritiesSelectedInput(authorityName, true);

      } else { /* already selected */ }
    },

    onAuthorityRemoved: function CreateOrEditEventScheduling_onAuthorityRemoved(authorityId, args) {
      if (this.modules.authorityFinder.selectedItems[authorityId]) {
        // Delete DIV element
        var authoritiesSelectedDiv = Dom.get(this.id + "-authorities-selected");
        if (authoritiesSelectedDiv) {
          var authorityDiv = Dom.get(this.id + '-' + authorityId);
          if (authorityDiv) {
            authoritiesSelectedDiv.removeChild(authorityDiv);
          }
        }

        // Update INPUT
        this.updateAuthoritiesSelectedInput(authorityId, false);

        // Update the 'authorityFinder'
        delete this.modules.authorityFinder.selectedItems[authorityId];
        if (this.modules.authorityFinder.itemSelectButtons[authorityId]) {
          this.modules.authorityFinder.itemSelectButtons[authorityId].set("disabled", false);
        }
      }
    },

    updateAuthoritiesSelectedInput: function CreateOrEditEventScheduling_updateAuthoritiesSelectedInput(authorityName, add) {
      // TODO: -authorities-added, -authorities-removed?
      var authoritiesInput = Dom.get(this.id + "-authorities");
      if (authoritiesInput) {
        var values = [],
            currVal = authoritiesInput.value;

        if (currVal != "") {
          values = authoritiesInput.value.split(',');
        }

        if (add == true) {
          values.push(authorityName);
        } else {
          values = Alfresco.util.arrayRemove(values, authorityName);
        }

        Dom.get(this.id + "-authorities").value = values.join(',');

        // Simulate "keypress" event
        YAHOO.util.UserAction.keypress(authoritiesInput);
      }
    },

    /** Private functions **/
    _getNewTabIndex: function CreateOrEditEventScheduling__getNewTabIndex() {
      if (!this.lastTabIndex) {
        var elts = Dom.getElementsByClassName("hasTabIndex", null, this.id + '-form');
        if (elts.length > 0) {
          var lastElTabIndex = elts[elts.length - 1].getAttribute("tabindex");
          if (lastElTabIndex) {
            this.lastTabIndex = parseInt(lastElTabIndex, 10);
          }
        }
      }
      return (this.lastTabIndex += 1);
    },

    _removeFormValidation: function CreateOrEditEventScheduling__removeFormValidation(fieldId) {
      for (var i=0, ii=this.form.validations.length ; i<ii ; i++) {
        var validation = this.form.validations[i];
        if (validation.fieldId == fieldId) {
          Alfresco.util.arrayRemove(this.form.validations, validation);
        }
      }
      this.form.updateSubmitElements();
    }
  });
})();