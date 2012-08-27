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
 * @class Alfresco.module.AnswerEventDialog
 */
(function ()
{
  /**
   * YUI Library aliases
   */
  var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      KeyListener = YAHOO.util.KeyListener,
      formatDate = Alfresco.util.formatDate,
      fromISO8601 = Alfresco.util.fromISO8601;

  /**
   * Alfresco Slingshot aliases
   */
  var $html = Alfresco.util.encodeHTML,
      $userProfileLink = Alfresco.util.userProfileLink;

  /**
   * Dashboard CreateOrEditEvent constructor.
   *
   * @param {String} htmlId The HTML id of the parent element
   * @return {Alfresco.module.AnswerEventDialog} The new component instance
   * @constructor
   */
  Alfresco.module.AnswerEventDialog = function AnswerEventDialog_constructor(htmlId) {
    Alfresco.module.AnswerEventDialog.superclass.constructor.call(this, "Alfresco.module.AnswerEventDialog", htmlId, ["dom", "container", "datasource", "datatable", "paginator", "event", "element"]);

    var me = this;
    // Hook action events
    var fnActionHandler = function fnActionHandler(layer, args) {
      var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
      if (owner !== null) {
        if (typeof me[owner.className] == "function") {
          args[1].stop = true;
          me[owner.className].call(me, args[1].target, owner);
        }
      }
      return true;
    };
    YAHOO.Bubbling.addDefaultAction("answer-dialog-action-link", fnActionHandler, true);

    return this;
  };

  /**
   * Extend from Alfresco.component.Base and add class implementation
   */
  YAHOO.extend(Alfresco.module.AnswerEventDialog, Alfresco.component.Base, {
    /**
     * Object container for initialization options
     *
     * @property options
     * @type object
     */
    options: {
      /**
       * Event nodeRef
       *
       * @property nodeRef
       * @type string
       * @default null
       */
      nodeRef: null,

      /**
       * Current user
       *
       * @property currentUser
       * @type string
       * @default null
       */
      currentUser: null,

      /**
       * Minimal dialog width (pixels)
       *
       * @property minDialogWidth
       * @type integer
       * @default 800
       */
      minDialogWidth: 800,

      /**
       * Event details
       *
       * @property eventDetails
       * @type Object
       * @default ""
       */
      eventDetails: "",

      /**
       * Maximum number of answers to display per page.
       *
       * @property rowsPerPage
       * @type integer
       * @default 15
       */
      rowsPerPage: 15,

      /**
       * Datatable user column width
       *
       * @property userColumnWidth
       * @type integer
       * @default 325
       */
      userColumnWidth: 325
    },

    renderCellResponse: function(elCell, oRecord, oColumn, oData) {
      var desc = "";

      if (oData == "true" || ((typeof oData == "boolean") && oData == true)) {
        desc = '<div class="response yes"><img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/answers/yes-16.png" title="' + this.msg("label.yes") + '" /></div>';
      } else if (oData == "false" || ((typeof oData == "boolean") && oData == false)) {
        desc = '<div class="response no"><img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/answers/no-16.png" title="' + this.msg("label.no") + '" /></div>';
      } else if (oData == null || oData == "") {
        desc = '<div class="response dnk">?</div>';
      }

      elCell.innerHTML = desc;
    },

    renderCellActionUser: function(elCell, oRecord, oColumn, oData) {
      var data = oRecord.getData();

      oColumn.width = 24;
      Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

      if (data.user.exists === "true") {
        elCell.innerHTML = '<div class="onNotifyUser"><a href="#" class="answer-dialog-action-link notify-user" title="' + this.msg("label.action.onNotifyUser", data.user.displayName) + '">&nbsp;</a></div>';
      }
    },

    onDataRetrived: function AnswerEventDialog_onDataRetrived(response, displayIntoDialog) {
      if (displayIntoDialog) {
        /** Dialog **/
        var recommandedWidth = this.options.userColumnWidth + ((response.json.fields.length - 1) * 110) + ((this.options.eventDetails.isOwner && !this.options.eventDetails.isArchived && !this.options.eventDetails.isLocked) ? 24 : 0); // pixels
        var dialogWidth = (recommandedWidth > window.innerWidth) ? window.innerWidth * 0.98 : recommandedWidth;
        if (dialogWidth < this.options.minDialogWidth) {
          dialogWidth = this.options.minDialogWidth;
        }

        this.dialog = this._createDialog({ width: dialogWidth + 'px' });
        this.dialog.setHeader(this.options.eventDetails.title);
        this.dialog.render(document.body);

        // Register the ESC key to close the dialog
        this.widgets.escapeListener = new KeyListener(document, {
          keys: KeyListener.KEY.ESCAPE
        }, {
          fn: function(id, keyEvent) {
            this.dialog.destroy();
          },
          scope: this,
          correctScope: true
        });
        this.widgets.escapeListener.enable();

        // Link to standalone page
        Dom.get(this.id + "-standalone-page").innerHTML = '<a href="' + Alfresco.constants.URL_PAGECONTEXT + "answer-event?nodeRef=" + this.options.eventDetails.nodeRef + '" target="_blank">' + this.msg("label.link.standalone-page") + '</a>';
      }
      this.setupDatatables(response.json);

      if (this.dialog) {
        var me = this;

        /***********************************************/
        /** DATATABLE EDITION BUG FIX IN MODAL DIALOG **/
        /***********************************************/
        // http://yuiblog.com/sandbox/yui/v260/examples/container/modalDataTableEditor.html
        this.widgets.datatable.doBeforeShowCellEditor = function(cellEditor) {
          var el = cellEditor.getContainerEl();
          if (el.parentNode === document.body) {
            me.dialog.body.appendChild(el);
            cellEditor.subscribe("showEvent", function() {
              // Need to wait till show, because Dom.setXY won't work on elements with display:none, and we need to use Dom.setXY to
              // set page co-ordinates, instead of offsetParent relative co-ordinates
              var xy = YAHOO.util.Dom.getXY(this.getTdEl());
              YAHOO.util.Dom.setXY(this.getContainerEl(), xy);
            });
          }
          return true;
        };
        /***********************************************/

        // Show dialog
        this.dialog.show();
      }
    },

    setupDatatables: function AnswerEventDialog_setupDatatables(obj) {
      var me = this,
          evt = this.options.eventDetails;

      /** Event details **/
      var eventDetailsLeftEl = new YAHOO.util.Element(this.id + "-event-details-left");
      if (eventDetailsLeftEl) {
        eventDetailsLeftEl.appendChild(this._addEventInformation(this.msg('label.event.title'), evt.title));
        if (evt.description) {
          eventDetailsLeftEl.appendChild(this._addEventInformation(this.msg('label.event.description'), evt.description.replace(/\n/g, "<br/>")));
        }
        eventDetailsLeftEl.appendChild(this._addEventInformation(this.msg('label.event.last-activity', ''), Alfresco.util.relativeTime(fromISO8601(evt.modifiedOnISO))));
      }

      var eventDetailsRightEl = new YAHOO.util.Element(this.id + "-event-details-right");
      if (eventDetailsRightEl) {
        eventDetailsRightEl.appendChild(this._addEventInformation(this.msg('label.event.created-by', ''), $userProfileLink(evt.createdByUser, evt.createdBy, 'target="_blank" class="theme-color-1"')));
        eventDetailsRightEl.appendChild(this._addEventInformation(this.msg('label.event.created-on', ''), formatDate(fromISO8601(evt.createdOnISO), this.msg('date-format.fullDateTime'))));
        eventDetailsRightEl.appendChild(this._addEventInformation(this.msg('label.event.participants'), ((evt.visibility == 'private') ? evt.participants : obj.data.length - ((evt.participated) ? 0 : 1))));
      }


      /** Datatable **/
      var dataSource = new YAHOO.util.DataSource(obj.data, {
        responseType: YAHOO.util.DataSource.TYPE_JSARRAY,
        responseSchema: {
          fields: obj.fields
        }
      });

      this.widgets.datatable = new YAHOO.widget.DataTable(this.id + "-datatable", this._buildDatatableColumnDefs(obj.columnDefs), dataSource, {
        paginator: new YAHOO.widget.Paginator({
          containers: this.id + '-datatable-pagination',
          rowsPerPage: this.options.rowsPerPage,
          recordOffset: 0,
          template: Alfresco.util.message("pagination.template"),
          pageReportTemplate: Alfresco.util.message("pagination.template.page-report"),
          previousPageLinkLabel: Alfresco.util.message("pagination.previousPageLinkLabel"),
          nextPageLinkLabel: Alfresco.util.message("pagination.nextPageLinkLabel")
        })
      });

      // Set up editing flow
      var highlightEditableCell = function(oArgs) {
        var elCell = this.getTdEl(oArgs.target);
        if (elCell) {
          var record = this.getRecord(elCell);
          var usr = record.getData().user;
          if (usr.userName == me.options.currentUser) {
            this.highlightCell(oArgs.target);
          } else {
            if (Dom.hasClass(oArgs.target, "yui-dt-editable")) {
              Dom.removeClass(oArgs.target, "yui-dt-editable");
            }
          }
        }
      };

      // Set up cell editors
      var onEventShowCellEditor = function(oArgs) {
        if (!this.isDisabled()) {
          var elCell = this.getTdEl(oArgs.target);
          if (elCell) {
            var record = this.getRecord(elCell);
            var usr = record.getData().user;
            if (usr.userName == me.options.currentUser) {
              this.showCellEditor(oArgs.target);
            }
          }
        }
      };

      // CellEditor save event
      var onEditorSave = function(oArgs) {
        var oRecord = oArgs.editor.getRecord();
        var columnKey = oArgs.editor.getColumn().getKey();
        var userInfo = oRecord.getData('user');

        // Be sur that we edit the correct user
        if (userInfo && (userInfo.userName == me.options.currentUser)) {
          if (oArgs.newData != oArgs.oldData) {
            Alfresco.util.Ajax.request({
              url: Alfresco.constants.PROXY_URI + "slingshot/dashlets/answer-to-event",
              method: Alfresco.util.Ajax.POST,
              requestContentType : "application/json",
              responseContentType : "application/json",
              dataObj: {
                eventNodeRef: me.options.nodeRef,
                dateNodeRef: "workspace://SpacesStore/" + columnKey,
                oldData: oArgs.oldData,
                newData: oArgs.newData
              },
              successCallback: {
                fn: me.onAnswerOk,
                scope: me,
                obj: { elCell: oArgs.editor.getTdEl(), columnKey: columnKey, oldData: oArgs.oldData, newData: oArgs.newData}
              },
              failureCallback: {
                fn: me.onAnswerFailure,
                scope: me,
                obj: { elCell: oArgs.editor.getTdEl(), columnKey: columnKey, oldData: oArgs.oldData, newData: oArgs.newData}
              }
            });
          }
        } else { /* Not allowed to edit this user */ }
      };

      if (!evt.isArchived && !evt.isLocked) {
        this.widgets.datatable.subscribe("cellMouseoverEvent", highlightEditableCell);
        this.widgets.datatable.subscribe("cellMouseoutEvent", this.widgets.datatable.onEventUnhighlightCell);
        this.widgets.datatable.subscribe("cellClickEvent", onEventShowCellEditor);
        this.widgets.datatable.subscribe("editorSaveEvent", onEditorSave);
      }

      // Sort datatable by user
      this.widgets.datatable.sortColumn(this.widgets.datatable.getColumn("user"));

      // Select first row
      this.widgets.datatable.selectRow(this.widgets.datatable.getTrEl(0));


      /** Count datatable **/
      var dtParams = this._getDatatableParticipantsCountData(obj.fields);
      var dataSourceParticipantsCount = new YAHOO.util.DataSource(dtParams.data, { responseType: YAHOO.util.DataSource.TYPE_JSARRAY, responseSchema: { fields: obj.fields } });
      this.widgets.datatableParticipantsCount = new YAHOO.widget.DataTable(this.id + "-datatable-participants-count", dtParams.columnDefs, dataSourceParticipantsCount, {});
    },

    onAnswerOk: function AnswerEventDialog_onAnswerOk(response, obj) {
      YAHOO.Bubbling.fire("refreshScheduledEvents", {});

      // update 'count participants datatable'
      var record = this.widgets.datatableParticipantsCount.getRecord(0);
      var count = record.getData(obj.columnKey);
      if (obj.newData == "true") {
        count ++;
      } else if (obj.oldData == "true") {
        count --;
      }

      if (count < 0) { count = 0; }

      record.setData(obj.columnKey, count);

      // upddate datatable
      this.widgets.datatableParticipantsCount.updateRow(record, record.getData());
    },

    onAnswerFailure: function AnswerEventDialog_onAnswerFailure(response, obj) {
      if (obj.elCell) {
        var record = this.widgets.datatable.getRecord(obj.elCell);
        record.setData(obj.columnKey, obj.oldData);

        Alfresco.util.PopupManager.displayPrompt({
          title: Alfresco.util.message("message.failure"),
          text: this.msg("message.answer.failure")
        });

        // upddate datatable
        this.widgets.datatable.updateRow(record, record.getData());
      }
    },

    onNotifyUser: function AnswerEventDialog_onNotifyUser(target) {
      this._showConfirmDialog("notify-user", "onNotifyUserConfirm", target);
    },

    onNotifyUserConfirm: function AnswerEventDialog_onNotifyUserConfirm(target) {
      var item = this.widgets.datatable.getRecord(target).getData();
      var nodeRef = new Alfresco.util.NodeRef(this.options.nodeRef);
      var url = Alfresco.constants.PROXY_URI + "/slingshot/dashlets/notify-user/node/" + nodeRef.uri + "/user/" + item.user.userName + "?templateName=event_reminder";

      Alfresco.util.Ajax.request(
      {
        url: url,
        method: Alfresco.util.Ajax.POST,
        successMessage: this.msg("message.mail-reminder.user.success", item.user.displayName),
        failureMessage: this.msg("message.mail-reminder.user.failure", item.user.displayName)
      });
    },

    onNotifyAllUsers: function AnswerEventDialog_onNotifyAllUsers(target) {
      this._showConfirmDialog("notify-users", "onNotifyAllUsersConfirm", target);
    },

    onNotifyAllUsersConfirm: function AnswerEventDialog_onNotifyAllUsersConfirm(target) {
      var nodeRef = new Alfresco.util.NodeRef(this.options.nodeRef);
      var url = Alfresco.constants.PROXY_URI + "/slingshot/dashlets/notify-users/node/" + nodeRef.uri + "?templateName=event_reminder";

      Alfresco.util.Ajax.request(
      {
        url: url,
        method: Alfresco.util.Ajax.POST,
        successMessage: this.msg("message.mail-reminder.users.success"),
        failureMessage: this.msg("message.mail-reminder.users.failure")
      });
    },

    _showConfirmDialog: function AnswerEventDialog__showConfirmDialog(action, fnName, target) {
      var me = this;
      Alfresco.util.PopupManager.displayPrompt({
        title: this.msg("message." + action),
        text: this.msg("message.confirm." + action),
        buttons: [
        {
          text: this.msg("button.yes"),
          handler: function() {
            this.destroy();
            me[fnName].call(me, target);
          }
        },
        {
          text: this.msg("button.cancel"),
          handler: function() {
            this.destroy();
          },
          isDefault: true
        }]
      });
    },

    /**
     * Show dialog
     * @method show
     */
    show: function AnswerEventDialog_show(displayIntoDialog) {
      Alfresco.util.Ajax.request({
        url: Alfresco.constants.PROXY_URI + "slingshot/dashlets/event-answers/" + Alfresco.util.NodeRef(this.options.nodeRef).uri,
        method: "GET",
        successCallback: {
          fn: this.onDataRetrived,
          scope: this,
          obj: displayIntoDialog
        },
        failureMessage: this.msg("message.retrieve-answers.failure")
      });
    },

    _createDialog: function AnswerEventDialog__createDialog(opts) {
      var config = {
        width: this.options.minDialogWidth + "px",
        fixedcenter: true,
        close: true,
        draggable: true,
        modal: true,
        visible: false
      };

      if (opts) {
        config = YAHOO.lang.merge(config, opts);
      }

      var dialog = new YAHOO.widget.Panel(this.id + "-dialog", config);
      var html = '<div class="event-details-container">' +
                   '<div class="event-details yui-gd">' +
                      '<div id="' + (this.id + '-event-details-left') + '" class="left"></div>' +
                      '<div id="' + (this.id + '-event-details-right') + '" class="right"></div>' +
                   '</div>' +
                   '<div id="' + (this.id + '-datatable') + '"></div>' +
                   '<div id="' + (this.id + '-datatable-participants-count') + '" class="participants-count"></div>' +
                   '<div id="' + (this.id + '-standalone-page') + '" class="standalone-page-link"></div>' +
                   '<div id="' + (this.id + '-datatable-pagination') + '"></div>' +
                 '</div>';

      dialog.setBody(html);
      Dom.addClass(dialog.element, "answer-event");

      // Destroy on hide
      dialog.hideEvent.subscribe(function() {
        YAHOO.lang.later(0, null, function() { dialog.destroy(); });
      });

      return dialog;
    },

    _addEventInformation: function AnswerEventDialog__addEventInformation(label, content) {
      var el = document.createElement('div');
      Dom.addClass(el, "yui-gd");
      el.innerHTML = '<div class="evt-property first">' + this.msg(label) + '</div><div class="evt-property">' + content + '</div>';
      return el;
    },

    _getDatatableParticipantsCountData: function AnswerEventDialog__getDatatableParticipantsCountData(fields) {
      var me = this;
      var columnDefs = [],
          data = {
            user: this.msg("label.column.total")
          };

      var allDatatableRecordSet = this.widgets.datatable.getRecordSet();
      if (allDatatableRecordSet) {
        for (var i=0, ii=allDatatableRecordSet.getLength() ; i<ii ; i++) {
          var record = allDatatableRecordSet.getRecord(i);
          if (record) {
            var rowData = record.getData();
            for (var j=0, jj=fields.length ; j<jj ; j++) {
              var key = fields[j].key;

              if (i === 0) {
                var el = YAHOO.util.Selector.query(('td.' + "yui-dt-col-" + key), record.getId(), true);
                if (key == "user") {
                  columnDefs.push({ key: key, formatter: function(elCell, oRecord, oColumn, oData) {
                      oColumn.width = me.options.userColumnWidth;
                      Dom.setStyle(elCell, "width", oColumn.width + "px");
                      Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
                      elCell.innerHTML = '<div>' + oData + '</div>';
                    }
                  });
                } else {
                  columnDefs.push({ key: key, width: el.clientWidth - 3 });
                }
              }

              if (typeof rowData[key] == "string") {
                if (!data[key]) { data[key] = 0; }

                if (rowData[key] == "true") {
                  data[key] ++;
                }
              }
            }
          }
        }
      }

      // add 'actions' column for event owner
      if (this.options.eventDetails.isOwner && !this.options.eventDetails.isArchived && !this.options.eventDetails.isLocked) {
        columnDefs.push({
            key: "actions",
            label: '&nbsp;',
            sortable: false,
            formatter: function(elCell, oRecord, oColumn, oData) {
              oColumn.width = 24;
              Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

              if (me.options.eventDetails.visibility == "private") {
                elCell.innerHTML = '<div class="onNotifyAllUsers"><a href="#" class="answer-dialog-action-link notify-user" title="' + me.msg("label.action.onNotifyAllUsers") + '">&nbsp;</a></div>';
              } else {
                elCell.innerHTML = "";
              }
            }
          }
        );
      }

      return {
        data: [data],
        columnDefs: columnDefs
      };
    },

    _buildDatatableColumnDefs: function AnswerEventDialog__buildDatatableColumnDefs(defaultConfig) {
      var me = this;
      var dtColumnDefs = [];

      var sortUser = function(a, b, desc, field) {
        if (a.getData(field).userName == me.options.currentUser) {
          return -1;
        } else if (b.getData(field).userName == me.options.currentUser) {
          return 1;
        }

        var compare = YAHOO.util.Sort.compare,
            sorted = compare(a.getData(field).displayName, b.getData(field).displayName, desc);
        if (sorted === 0) {
          return compare(a.getCount(), b.getCount(), desc); // Bug 1932978
        } else {
          return sorted;
        }
      };

      var sortAnswers = function(a, b, desc, field) {
        var getInValue = function(val) {
          if (!val) { return -1; } else if (val == "true") { return 1; } else if (val == "false") { return 0; }
        };

        var compare = YAHOO.util.Sort.compare,
            valA = getInValue(a.getData(field)),
            valB = getInValue(b.getData(field)),
            sorted = compare(valA, valB, desc);

        if (sorted === 0) {
          return compare(a.getCount(), b.getCount(), desc); // Bug 1932978
        } else {
          return sorted;
        }
      };

      var renderCellUser = function(elCell, oRecord, oColumn, oData) {
        var desc = "",
            rowNumber = this.getRecordIndex(oRecord) + 1;

        // Set fix column size
        oColumn.width = me.options.userColumnWidth;
        Dom.setStyle(elCell, "width", oColumn.width + "px");
        Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

        desc += '<div class="count">' + (rowNumber >= 10 ? rowNumber : '0' + rowNumber) + '&nbsp;-&nbsp;</div>';
        desc += '<div>' + $userProfileLink(oData.userName, oData.displayName, 'target="_blank" class="user"') + '</div>';

        elCell.innerHTML = desc;
      };

      for (var i=0, ii=defaultConfig.length ; i<ii ; i++) {
        var column = defaultConfig[i];

        if (column.key == "user") {
          dtColumnDefs.push({
              key: "user",
              label: this.msg("label.column.user"),
              sortable: true,
              sortOptions: { sortFunction: sortUser },
              formatter: renderCellUser
            }
          );
        }
        else if (column.type == "month") {
          var dateparts = column.label.split('-'), // "2012-08"
              month = dateparts[1],
              year = dateparts[0];

          var children = [];
          if (column.children.length > 0) {
            for (var j=0, jj=column.children.length ; j<jj ; j++) {
              var child = column.children[j];

              // label
              var dayDate = new Date(year, parseInt(month, 10) - 1, child.label);
              var dayStr = Alfresco.util.formatDate(dayDate, 'dddd');
              var dayLabel = this.msg('label.day.' + dayDate.getDate(), dayStr);

              if (child.key && child.type == "date") {
                children.push({
                    key: child.key,
                    className: "th-day",
                    label: dayLabel,
                    sortable: true,
                    sortOptions: { sortFunction: sortAnswers, defaultDir: YAHOO.widget.DataTable.CLASS_DESC },
                    editor: new YAHOO.widget.RadioCellEditor({ radioOptions: [{label: this.msg("button.yes"), value: "true"}, {label: this.msg("button.no"), value: "false"}, {label: "?", value: ""}], disableBtns: true }),
                    formatter: this.bind(this.renderCellResponse)
                  }
                );
              }
              else if (child.children && child.children.length > 0) {
                var subchildren = [];

                for (var k=0, kk=child.children.length ; k<kk ; k++) {
                  var subchild = child.children[k];

                  subchildren.push({
                      key: subchild.key,
                      className: "th-time",
                      label: subchild.label,
                      sortable: true,
                      sortOptions: { sortFunction: sortAnswers, defaultDir: YAHOO.widget.DataTable.CLASS_DESC },
                      editor: new YAHOO.widget.RadioCellEditor({ radioOptions: [{label: this.msg("button.yes"), value: "true"}, {label: this.msg("button.no"), value: "false"}, {label: "?", value: ""}], disableBtns: true }),
                      formatter: this.bind(this.renderCellResponse)
                    }
                  );
                }

                children.push({
                    label: dayLabel,
                    className: "th-day",
                    children: subchildren
                  }
                );
              }
              else { /* Not handled */ }
            }
          }

          var months = this.msg("months.long").split(',');
          dtColumnDefs.push({
              className: "th-month",
              label:  this.msg('label.column.month', months[parseInt(month, 10) - 1], year),
              children: children
            }
          );
        }
        else {
          dtColumnDefs.push(column);
        }
      }

      // add 'actions' column for event owner
      if (this.options.eventDetails.isOwner && !this.options.eventDetails.isArchived && !this.options.eventDetails.isLocked) {
        dtColumnDefs.push({
            key: "actions",
            label: '&nbsp;',
            sortable: false,
            formatter: this.bind(this.renderCellActionUser)
          }
        );
      }

      return dtColumnDefs;
    }
  });
})();