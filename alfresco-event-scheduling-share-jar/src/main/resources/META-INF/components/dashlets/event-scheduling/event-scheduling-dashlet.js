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
 * @class Alfresco.dashlet.EventScheduling
 */
(function ()
{
  /**
   * YUI Library aliases
   */
  var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      toISO8601 = Alfresco.util.toISO8601,
      fromISO8601 = Alfresco.util.fromISO8601,
      formatDate = Alfresco.util.formatDate;

  /**
   * Alfresco Slingshot aliases
   */
  var $html = Alfresco.util.encodeHTML,
      $userProfileLink = Alfresco.util.userProfileLink,
      $siteDashboard = Alfresco.util.siteDashboardLink,
      $combine = Alfresco.util.combinePaths;

  /**
   * Preferences
   */
  var EVENT_SCHEDULING_DASHLET_PREFERENCES = "com.atolcd.share.dashlet.eventScheduling";

  /**
   * Dashboard EventScheduling constructor.
   *
   * @param {String} htmlId The HTML id of the parent element
   * @return {Alfresco.dashlet.EventScheduling} The new component instance
   * @constructor
   */
  Alfresco.dashlet.EventScheduling = function EventScheduling_constructor(htmlId) {
    return Alfresco.dashlet.EventScheduling.superclass.constructor.call(this, "Alfresco.dashlet.EventScheduling", htmlId, ["datasource", "datatable"]);
  };

  /**
   * Extend from Alfresco.component.Base and add class implementation
   */
  YAHOO.extend(Alfresco.dashlet.EventScheduling, Alfresco.component.Base, {
    /**
     * Object container for initialization options
     *
     * @property options
     * @type object
     */
    options: {
      siteId: {
        value: "",
        defaultValue: "",
        type: 'string',
        filter: false,
        classname: ""
      },

      canCreateEvent: {
        value: false,
        defaultValue: false,
        type: 'boolean',
        filter: false,
        classname: ""
      },

      currentUser: {
        value: null,
        defaultValue: null,
        type: 'string',
        filter: false,
        classname: ""
      },

      rowsPerPage: {
        value: 10,
        defaultValue: 10,
        type: 'integer',
        filter: false,
        classname: ""
      },

      /**
       * Max items filter.
       *
       * @property maxItems
       * @type integer
       * @default 20
       */
      maxItems: {
        value: 20,
        defaultValue: 20,
        type: 'integer',
        filter: true,
        classname: "",
        userPreference: EVENT_SCHEDULING_DASHLET_PREFERENCES + ".maxItemsFilter",
        sitePreference: EVENT_SCHEDULING_DASHLET_PREFERENCES + ".site.maxItemsFilter"
      },

      /**
       * Currently range filter.
       *
       * @property range
       * @type string
       * @default ""
       */
      range: {
        value: "",
        defaultValue: "",
        type: 'string',
        filter: true,
        classname: "",
        userPreference: EVENT_SCHEDULING_DASHLET_PREFERENCES + ".rangeFilter",
        sitePreference: EVENT_SCHEDULING_DASHLET_PREFERENCES + ".site.rangeFilter"
      },

      /**
       * Currently visibility filter.
       *
       * @property visibility
       * @type string
       * @default "public"
       */
      visibility: {
        value: "public",
        defaultValue: "public",
        type: 'string',
        filter: true,
        classname: "",
        userPreference: EVENT_SCHEDULING_DASHLET_PREFERENCES + ".visibilityFilter",
        sitePreference: EVENT_SCHEDULING_DASHLET_PREFERENCES + ".site.visibilityFilter"
      },

      /**
       * Currently active filter.
       *
       * @property path
       * @type string
       * @default "all"
       */
      path: {
        value: "all",
        defaultValue: "all",
        type: 'string',
        filter: true,
        classname: "",
        userPreference: EVENT_SCHEDULING_DASHLET_PREFERENCES + ".pathFilter",
        sitePreference: EVENT_SCHEDULING_DASHLET_PREFERENCES + ".site.pathFilter"
      }
    },

    /**
     * Events DOM container.
     *
     * @property eventsContainer
     * @type object
     */
    eventsContainer: null,

    /**
     * Events DOM footer.
     *
     * @property footer
     * @type object
     */
    footer: null,

    /**
     * ContainerId for events scope query
     *
     * @property containerId
     * @type string
     * @default ""
     */
    containerId: null,


    /**
     * Set multiple initialization options at once.
     * @method setOptions
     * @override
     */
    setOptions: function EventScheduling_setOptions(opts) {
      for (var opt in opts) {
        if (this.options[opt]) {
          if (typeof opts[opt] == "object") {
            this.options[opt] = YAHOO.lang.merge(this.options[opt], opts[opt]);
          } else {
            this.options[opt].value = opts[opt];
          }
        }
      }
      return this;
    },

    /**
     * Fired by YUI when parent element is available for scripting
     * @method onReady
     */
    onReady: function EventScheduling_onReady() {
      YAHOO.Bubbling.on("refreshScheduledEvents", this.refreshEvents, this);

      var me = this;

      // Generic action
      this.modules.actions = new Alfresco.module.DoclibActions();

      // The events container
      this.eventsContainer = Dom.get(this.id + "-events");
      this.footer = Dom.get(this.id + "-footer");

      // Preferences service
      this.services.preferences = new Alfresco.service.Preferences();

      /** Check default item menu **/
      var checkMenuItem = function(pMenu, pFilterValue, pSilent) {
        // Loop through and find the menuItem corresponding to the default filter
        var menuItems = pMenu.getItems(), menuItem, i, ii;

        for (i = 0, ii = menuItems.length; i < ii; i++) {
          menuItem = menuItems[i];
          if (menuItem.value == pFilterValue) {
            pMenu.clickEvent.fire({
              type: "click"
            }, menuItem, pSilent);
            break;
          }
        }
      };

      // Dropdown filters
      for (var option in this.options) {
        if (this.options[option].filter) {
          var widgetName = option + 'Filter',
              buttonId = this.id + '-filter-' + option;

          this.widgets[widgetName] = new YAHOO.widget.Button(buttonId, {
            type: "split",
            menu: buttonId + '-menu',
            lazyloadmenu: false
          });
          this.widgets[widgetName].on("click", this.onFilterClicked, option, this);

          if (this.options[option].classname) {
            this.widgets[widgetName].addClass(this.options[option].classname);
          }

          // Clear the lazyLoad flag and fire init event to get menu rendered into the DOM
          var menu = this.widgets[widgetName].getMenu();
          var onMenuClick = function (e, p_aArgs, obj) {
            var menuItem = p_aArgs[1],
                widgetName = obj[0]
                filterName = obj[1];
            if (menuItem) {
              me.widgets[widgetName].set("label", menuItem.cfg.getProperty("text"));
              if (!p_aArgs[2]) { // silent call ?
                me.onFilterChanged.call(me, p_aArgs[1], filterName);
              }
            }
          };
          menu.subscribe("click", onMenuClick, [widgetName, option]);

          // Check menu filter
          if (this.options[option].value == this.options[option].defaultValue) {
            this.setFilter(this.options[option].defaultValue, option, true, true); // no persist & silent call
          } else {
            this.widgets[widgetName].value = this.options[option].value;
            checkMenuItem(menu, this.options[option].value, true); // silent call
          }
        }
      }

      // Hook action events
      var fnActionHandler = function fnActionHandler(layer, args) {
        var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "span");
        if (owner !== null) {
          if (typeof me[owner.className] == "function") {
            args[1].stop = true;
            var asset = me.widgets.alfrescoDataTable.getDataTable().getRecord(args[1].target).getData();
            me[owner.className].call(me, asset, owner);
          }
        }
        return true;
      };
      YAHOO.Bubbling.addDefaultAction("action-link", fnActionHandler);

      this.onPreferencesLoaded();
    },

    /**
     * Set a value to a filter
     * @method setFilter
     * @param filterValue {string} Filter value
     * @param filterName {string} Filter name
     * @param noPersist {boolean} No persist preference ?
     * @param silent {boolean} Silent call ?
     */
    setFilter: function EventScheduling_setFilter(filterValue, filterName, noPersist, silent) {
      var option = this.options[filterName];
      option.value = filterValue;

      if (!silent) {
        this.refreshEvents();

        if (noPersist !== true) {
          this.services.preferences.set((this.options.siteId.value != "") ? option.sitePreference : option.userPreference, filterValue);
        }
      }
    },

    /**
     * Refresh events
     * @method refreshEvents
     */
    refreshEvents: function EventScheduling_refreshEvents() {
      this.widgets.alfrescoDataTable.loadDataTable(this._buildStringParameters());
    },

    /**
     * Refresh events
     * @method onPreferencesLoaded
     */
    onPreferencesLoaded: function EventScheduling_onPreferencesLoaded() {
      /**
       * Create datatable with a simple pagination that only displays number of results.
       * The pagination is handled in the "base" data source url and can't be changed in the dashlet
       */
      var me = this;
      var webscript = "slingshot/dashlets/events-scheduled/" + ((this.options.siteId.value) ? $combine("site", this.options.siteId.value) : $combine("user"));
      this.widgets.alfrescoDataTable = new Alfresco.util.DataTable({
        dataSource: {
          url: Alfresco.constants.PROXY_URI + webscript,
          pagingResolver: function(currentSkipCount, currentMaxItems) {
            return me._buildStringParameters() + "&" + "skipCount=" + currentSkipCount + "&" + "pageSize=" + currentMaxItems;
          }
        },
        dataTable: {
          container: this.eventsContainer,
          columnDefinitions: [
            {
              key: "nodeRef",
              hidden: true
            },
            {
              key: "participated",
              sortable: false,
              formatter: this.bind(this.renderCellIcons),
              width: 48
            },
            {
              key: "eventDescription",
              sortable: false,
              formatter: this.bind(this.renderCellDescription)
            },
            {
              key: "actions",
              sortable: false,
              formatter: this.bind(this.renderCellActions),
              width: 50
            }
          ],
          config: {
            MSG_EMPTY: this.msg("message.noEvents")
          }
        },
        paginator: {
          history: false,
          hide: false,
          config: {
            containers: [this.id + "-paginator"],
            rowsPerPage: this.options.rowsPerPage.value
          }
        }
      });

      // Override DataTable function to set custom empty message
      var me = this,
        dataTable = this.widgets.alfrescoDataTable.getDataTable(),
        original_doBeforeLoadData = dataTable.doBeforeLoadData;

      dataTable.doBeforeLoadData = function MyTasks_doBeforeLoadData(sRequest, oResponse, oPayload) {
        // Hide the paginator if there are fewer rows than would cause pagination
        Dom.setStyle(this.configs.paginator.getContainerNodes(), "visibility", (oResponse.results.length == 0) ? "hidden" : "visible");

        if (oResponse.results.length === 0) {
          oResponse.results.unshift({
            isInfo: true,
            title: me.msg("empty.title"),
            description: me.msg("empty.description") + ((me.options.canCreateEvent == true) ? '<br><span class="onCreateEventClick"><a href="#" class="action-link" title="">' + me.msg("dashlet.create-event.tooltip") + '</a></span>' : '')
          });
        }

        return original_doBeforeLoadData.apply(this, arguments);
      };

      var onDatatableRender = function(oArgs) {
        Dom.replaceClass(me.id + "-refresh", "refresh-loading", "refresh");
      };
      this.widgets.alfrescoDataTable.getDataTable().subscribe("renderEvent", onDatatableRender);
    },

    renderCellIcons: function(elCell, oRecord, oColumn, oData) {
      var data = oRecord.getData(),
          desc = "";

      if (data.isInfo) {
        oColumn.width = 48;
        Dom.setStyle(elCell, "width", oColumn.width + "px");
        Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

        desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/help-event-scheduling-bw-32.png" />';
      }
      else {
        if (data.isArchived) {
          desc += '<div class="event-status">' +
                    '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/indicators/archived-16.png" title="' + this.msg("label.help.archived") + '" />' +
                  '</div>';
        } else {
          // participation
          if (!data.participated) {
            desc += '<div class="event-status">' +
                      '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/indicators/not-participated-16.png" title="' + this.msg("label.help.not-participated") + '" />' +
                    '</div>';
          } else if (data.respondedToAll) {
            desc += '<div class="event-status">' +
                      '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/indicators/responded-to-all-16.png" title="' + this.msg("label.help.responded-to-all") + '" />' +
                    '</div>';
          } else {
            desc += '<div class="event-status">' +
                      '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/indicators/has-participated-16.png" title="' + this.msg("label.help.has-participated") + '" />' +
                    '</div>';
          }

          // validity
          if (data.validityDate) {
            var today = new Date().getTime();
            var expireDate = fromISO8601(data.validityDate.isoDate).getTime();
            if (today > expireDate) {
              desc += '<div class="event-status">' +
                        '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/indicators/has-expire-16.png" title="' + this.msg("label.help.has-expire") + '" />' +
                      '</div>';
            } else if ((expireDate - today) < (7 * 24*60*60*1000)) {
              desc += '<div class="event-status">' +
                        '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/indicators/expire-soon-16.png" title="' + this.msg("label.help.expire-soon") + '" />' +
                      '</div>';
            }
          }

          // locked
          if (data.isLocked) {
            desc += '<div class="event-status">' +
                      '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/indicators/locked-16.png" title="' + this.msg("label.help.locked") + '" />' +
                    '</div>';
          }
        }

        // in site?
        if (data.siteId && !this.options.siteId.value) {
          desc += '<div class="event-status">' +
                    '<a href="' + Alfresco.util.uriTemplate("sitedashboardpage", { site: data.siteId }) + '" target="_blank">' +
                      '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/dashlets/event-scheduling/images/indicators/site-bw-16.png" title="' + this.msg("label.help.in-site", data.siteTitle || data.siteId) + '" />' +
                    '</a>' +
                  '</div>';
        }
      }

      elCell.innerHTML = desc;
    },

    renderCellDescription: function(elCell, oRecord, oColumn, oData) {
      var data = oRecord.getData(),
          desc = "";

      if (data.isInfo) {
        desc += '<div class="empty"><h3>' + data.title + '</h3>';
        desc += '<span>' + data.description + '</span></div>';
      }
      else {
        desc += '<div>';
        desc +=   '<span class="event-title">' + data.title + '</span>';
        desc +=   '<span class="event-visibility">&nbsp;' + this.msg("label.event.visibility." + data.visibility) + '</span>';
        desc += '</div>';

        desc += '<div>';
        desc +=   '<span class="created-by">' + this.msg("label.event.created-by", $userProfileLink(data.createdByUser, data.createdBy, 'target="_blank" class="theme-color-1"')) + '</span>';
        if (data.visibility != "public" && data.participants > 0) {
          desc +=   '<span class="separator">&nbsp;|&nbsp;</span>';
          desc +=   '<span class="participants">' + this.msg("label.event.participated", '<b>' + data.participants + '</b>') + '</span>';
        }
        desc += '</div>';

        desc += '<div>';
        desc +=   '<span class="last-activity">' + this.msg("label.event.last-activity", Alfresco.util.relativeTime(fromISO8601(data.modifiedOnISO))) + '</span>';
        desc += '</div>';
      }

      elCell.innerHTML = desc;
    },

    renderCellActions:function(elCell, oRecord, oColumn, oData) {
      var data = oRecord.getData(),
          desc = "";

      if (data.isInfo) {
        oColumn.width = 0;
      }
      else {
        oColumn.width = 50;

        if (data.isOwner) {
          desc += '<div class="action-group firstel">';
          if (data.isArchived) {
            desc += '<span class="onUnArchiveEvent"><a href="#" class="action-link unarchive-event" title="' + this.msg("action.unarchive-event") + '">&nbsp;</a></span>';
          } else {
            if (data.isLocked) {
              oColumn.width = 75;
              desc += '<span class="onUnlockEvent"><a href="#" class="action-link unlock-event" title="' + this.msg("action.unlock-event") + '">&nbsp;</a></span>';
            } else {
              oColumn.width = 100;
              desc += '<span class="onLockEvent"><a href="#" class="action-link lock-event" title="' + this.msg("action.lock-event") + '">&nbsp;</a></span>';
              desc += '<span class="onEditEvent"><a href="#" class="action-link edit-event" title="' + this.msg("action.edit-event") + '">&nbsp;</a></span>';
            }

            desc += '<span class="onArchiveEvent"><a href="#" class="action-link archive-event" title="' + this.msg("action.archive-event") + '">&nbsp;</a></span>';
          }
          desc += '<span class="onDeleteEvent"><a href="#" class="action-link delete-event" title="' + this.msg("action.delete-event") + '">&nbsp;</a></span>';
          desc += '</div>';
        }

        desc += '<div class="action-group">';
        if (data.isOwner) {
          if (oColumn.width < 75) {
            oColumn.width = 75;
          }

          desc += '<span class="onViewEventHistory"><a href="#" class="action-link view-history-event" title="' + this.msg("action.view-history") + '">&nbsp;</a></span>';
        }
        desc += '<span class="onViewEvent"><a href="#" class="action-link view-event" title="' + this.msg("action.view-event") + '">&nbsp;</a></span>';
        desc += '<span class="onAnswerEvent"><a href="#" class="action-link answer-event" title="' + this.msg((data.isArchived || data.isLocked) ? "action.view-answers" : "action.answer-event") + '">&nbsp;</a></span>';
        desc += '</div>';
      }

      Dom.setStyle(elCell, "width", oColumn.width + "px");
      Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

      elCell.innerHTML = desc;
    },

    onViewEventHistory: function EventScheduling_onViewEventHistory(item) {
      var nodeRef = new Alfresco.util.NodeRef(item.nodeRef);
      var url = Alfresco.constants.PROXY_URI + "/slingshot/dashlets/event-history/node/" + nodeRef.uri;
      Alfresco.util.Ajax.request(
      {
        url: url,
        method: Alfresco.util.Ajax.GET,
        requestContentType : "application/json",
        successCallback: {
          fn: this._onHistoryRetrieves,
          scope: this
        },
        failureMessage: this.msg("message.history.failure")
      });
    },

    _onHistoryRetrieves: function EventScheduling__onHistoryRetrieves(response) {
      if (response.json.length == 0) {
        Alfresco.util.PopupManager.displayPrompt({
          title: this.msg("message.history.dialog.title"),
          text: this.msg("message.history.empty")
        });
      } else {
        var historyDialog = new YAHOO.widget.Panel(this.id + "-historyDialog", {
          width: "50em",
          fixedcenter: true,
          close: true,
          draggable: true,
          modal: true,
          visible: false
        });

        var html = "";
        for (var i=0, ii=response.json.length ; i<ii ; i++) {
          var historyItem = response.json[i];

          var createdDate = formatDate(fromISO8601(historyItem.created), this.msg('date-format.historyDate'));

          var user = historyItem.user.userName;
          if (historyItem.user.displayName != "") {
            user = $userProfileLink(historyItem.user.userName, historyItem.user.displayName, 'target="_blank" class="user"')
          }

          var dateStr = '';
          if (historyItem.time) {
            dateStr = formatDate(fromISO8601(historyItem.date), this.msg('date-format.eventHistoryTime', '')) + historyItem.time;
          } else {
            dateStr = formatDate(fromISO8601(historyItem.date), this.msg('date-format.eventHistoryDate'));
          }

          // add history item
          html += '<div class="historyItem">' + this.msg("message." + historyItem.type, createdDate, user, dateStr) + '</div>';
        }

        historyDialog.setBody('<div class="yui-g historyItems">' + html + '</div><div class="bdft"></div>');
        Dom.addClass(historyDialog.element, "event-history-dialog");

        // Destroy on hide
        historyDialog.hideEvent.subscribe(function() {
          YAHOO.lang.later(0, null, function() { historyDialog.destroy(); });
        });

        historyDialog.setHeader(this.msg("message.history.dialog.title"));
        historyDialog.render(document.body);
        historyDialog.show();
      }
    },

    onViewEvent: function EventScheduling_onViewEvent(item) {
      var opts = {
        siteId: this.options.siteId.value,
        nodeRef: item.nodeRef,
        mode: "view" // "view", "edit", "create"
      };

      new Alfresco.module.CreateOrEditEventScheduling(this.id).setOptions(opts).show();
    },

    onEditEvent: function EventScheduling_onEditEvent(item) {
      var opts = {
        siteId: item.siteId,
        nodeRef: item.nodeRef,
        mode: "edit" // "view", "edit", "create"
      };

      new Alfresco.module.CreateOrEditEventScheduling(this.id).setOptions(opts).show();
    },

    onArchiveEvent: function EventScheduling_onArchiveEvent(item, value) {
      var action = "archive";
      if (value == false) {
        action = "unarchive";
      }
      this._showUpdateMetadataDialog(item, action, "prop_evtsched_archived", (action == "archive"));
    },

    onUnArchiveEvent: function EventScheduling_onUnArchiveEvent(item) {
      this.onArchiveEvent(item, false);
    },

    _showUpdateMetadataDialog: function EventScheduling__showUpdateMetadataDialog(item, action, property, value) {
      var me = this;
      Alfresco.util.PopupManager.displayPrompt({
        title: this.msg("action." + action + "-event"),
        text: this.msg("message.confirm." + action, item.title),
        noEscape: true,
        buttons: [
        {
          text: this.msg("button." + action),
          handler: function() {
            this.destroy();
            me._onUpdateMetadataActionConfirm.call(me, item, action, property, value);
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

    _onUpdateMetadataActionConfirm: function EventScheduling__onUpdateMetadataActionConfirm(item, action, property, value) {
      var nodeRef = new Alfresco.util.NodeRef(item.nodeRef);
      var dataObj = {
        "prop_evtsched_lastUpdate": toISO8601(new Date())
      };
      dataObj[property] = value;

      // execute ajax request
      var url = Alfresco.constants.PROXY_URI + "/api/node/" + nodeRef.uri + "/formprocessor";
      Alfresco.util.Ajax.request(
      {
        url: url,
        method: Alfresco.util.Ajax.POST,
        requestContentType : "application/json",
        responseContentType : "application/json",
        dataObj: dataObj,
        successCallback: {
          fn: this.refreshEvents,
          scope: this
        },
        successMessage: this.msg("message." + action + ".success", item.title),
        failureMessage: this.msg("message." + action + ".failure", item.title)
      });
    },

    onLockEvent: function EventScheduling_onLockEvent(item, value) {
      var action = "lock";
      if (value == false) {
        action = "unlock";
      }
      this._showUpdateMetadataDialog(item, action, "prop_evtsched_locked", (action == "lock"));
    },

    onUnlockEvent: function EventScheduling_onUnlockEvent(item) {
      this.onLockEvent(item, false);
    },

    onDeleteEvent: function EventScheduling_onDeleteEvent(item) {
      var me = this;
      Alfresco.util.PopupManager.displayPrompt({
        title: this.msg("action.delete-event"),
        text: this.msg("message.confirm.delete", item.title),
        buttons: [
        {
          text: this.msg("button.delete"),
          handler: function() {
            this.destroy();
            me._onActionDeleteConfirm.call(me, item);
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

    _onActionDeleteConfirm: function EventScheduling__onActionDeleteConfirm(item) {
      var nodeRef = new Alfresco.util.NodeRef(item.nodeRef);

      this.modules.actions.genericAction({
        success: {
          callback: {
            fn: this.refreshEvents,
            scope: this
          },
          message: this.msg("message.delete.success", item.title)
        },
        failure: {
          message: this.msg("message.delete.failure", item.title)
        },
        webscript: {
          method: Alfresco.util.Ajax.DELETE,
          name: "file/node/{nodeRef}",
          params: {
            nodeRef: nodeRef.uri
          }
        }
      });
    },


    onAnswerEvent: function EventScheduling_onAnswerEvent(item) {
      var opts = {
        currentUser: this.options.currentUser.value,
        nodeRef: item.nodeRef,
        eventDetails: item
      };

      new Alfresco.module.AnswerEventDialog(this.id + "-answerEvent").setOptions(opts).show(true);
    },

    /***************************************************************************************************/
    /**
     * YUI WIDGET EVENT HANDLERS
     * Handlers for standard events fired from YUI widgets, e.g. "click"
     */

    onRefresh: function EventScheduling_onRefresh(e) {
      if (e) {
        // Stop browser's default click behaviour for the link
        Event.preventDefault(e);
      }
      Dom.replaceClass(this.id + "-refresh", "refresh", "refresh-loading");
      this.refreshEvents();
    },

    onFilterChanged: function EventScheduling_onFilterChanged(p_oMenuItem, pFilterName) {
      var filterValue = p_oMenuItem.value,
          widgetName = pFilterName + 'Filter';

      this.widgets[widgetName].value = filterValue;
      this.setFilter(filterValue, pFilterName);
    },

    onFilterClicked: function EventScheduling_onFilterClicked(p_oEvent, pFilterName) {
      var option = this.options[pFilterName],
          filterValue = (option.type == "integer" ? parseInt(option.value, 10) : option.value);
      this.setFilter(filterValue, pFilterName);
    },
    /***************************************************************************************************/

    /**
     * Event handler for refresh click
     * @method onCreateEventClick
     * @param e {object} Event
     */
    onCreateEventClick: function EventScheduling_onCreateEventClick(e, args) {
      if (e) { Event.stopEvent(e); }

      var opts = {
        siteId: this.options.siteId.value,
        mode: "create" // "view", "edit", "create"
      };

      new Alfresco.module.CreateOrEditEventScheduling(this.id).setOptions(opts).show();
    },

    /** Private functions **/
    _buildStringParameters: function EventScheduling__buildStringParameters() {
      var params = [];
      for (var optionId in this.options) {
        if (this.options[optionId].filter) {
          params.push(optionId + '=' + this.options[optionId].value);
        }
      }
      return params.join('&');
    },

    _capitaliseFirstLetter: function EventScheduling__capitaliseFirstLetter(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
  });
})();