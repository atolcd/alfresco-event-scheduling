<import resource="classpath:alfresco/extension/templates/webscripts/com/atolcd/slingshot/dashlets/event-scheduling/lib/event.scheduling.lib.js">

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

/*
{
  "mode": "create",
  "siteId": "",
  "title": "Futsal",
  "place": "Dijon - Soccer 5",
  "description": "5 contre 5 en indoor",
  "validityDate": "Mardi, 31 Juillet, 2012",
  "validityDate-iso": "2012-07-31T00:00:00.000+02:00",
  "visibility": "private",
  "authorities": "bef,GROUP_ALFRESCO_ADMINISTRATORS",
  "mail-notification": "on",
  "date0": "Samedi, 14 Juillet, 2012",
  "date0-iso": "2012-07-14T00:00:00.000+02:00",
  "datetime0": "14h",
  "date1": "Mardi, 24 Juillet, 2012",
  "date1-iso": "2012-07-24T00:00:00.000+02:00",
  "datetime1": "8h",
  "date2": "Mardi, 24 Juillet, 2012",
  "date2-iso": "2012-07-24T00:00:00.000+02:00",
  "datetime2": "14h"
}
*/

function main() {
  try {
    var mode = "",
        nodeRef = null,
        siteId = null,
        title = "",
        place = "",
        description = "",
        validityDate = null,
        visibility = "public",
        authorities = [],
        mailNotification = false,
        dates = {};

    var jsonKeys = json.keys();
    for ( ; jsonKeys.hasNext(); ) {
      var nextKey = jsonKeys.next();

      var value = new String(json.get(nextKey)).toString();
      if (value && value.length > 0) {
        if (nextKey == "mode") {
          mode = value.toString();
        } else if (nextKey == "siteId") {
          siteId = value;
        } else if (nextKey == "nodeRef") {
          nodeRef = value;
        } else if (nextKey == "title") {
          title = value;
        } else if (nextKey == "place") {
          place = value;
        } else if (nextKey == "description") {
          description = value;
        } else if (nextKey == "validityDate") {
          if (json.has("validityDate-iso")) {
            var javaDate = utils.fromISO8601(json.get("validityDate-iso"));
            validityDate = new Date(javaDate.getYear() + 1900, javaDate.getMonth(), javaDate.getDate(), 23, 59, 59, 999);
          }
        } else if (nextKey == "visibility") {
          visibility = value;
        } else if (nextKey == "authorities") {
          authorities = value.split(',');
        } else if (nextKey == "mail-notification") {
          mailNotification = true;
        } else if (/date[0-9]*\-iso/.test(nextKey)) {
          // date0-iso
          var dateId = nextKey.split("-iso")[0].substr("date".length); // 0, 1, 2, 3, ...
          var date = utils.fromISO8601(value);
          var datetime = json.has("datetime" + dateId) ? new String(json.get("datetime" + dateId)).toString() : null;

          var index = getEventDateFolderName(date);
          if (!dates[index]) {
            dates[index] = {
              title: json.has("date" + dateId) ? json.get("date" + dateId) : "",
              date: date,
              schedules: datetime ? [datetime] : []
            };
          } else {
            // TODO: check for duplicates
            if (datetime) {
              dates[index].schedules.push(datetime);
            }
          }
        }
      }
    }

    // Debug
    /*
    logger.log("mode : " + mode);
    logger.log("nodeRef : " + nodeRef);
    logger.log("site : " + siteId);
    logger.log("title : " + title);
    logger.log("place : " + place);
    logger.log("description : " + description);
    logger.log("validityDate : " + validityDate);
    logger.log("visibility : " + visibility);
    logger.log("authorities : " + authorities);
    logger.log("mail-notification : " + mailNotification);

    for (var date in dates) {
      logger.log("date : " + date + ", title : " + dates[date].title + ", hours : " + dates[date].schedules.join(' | '));
    }
    */

    var now = new Date();
    var eventNode = null;
    if (nodeRef) {
      // EDIT MODE
      eventNode = search.findNode(nodeRef);
      if (!eventNode) {
        status.setCode(status.STATUS_BAD_REQUEST, "Node '" + nodeRef + "' cannot be found.");
        return;
      }
      visibility = eventNode.properties["evtsched:visibility"];
    } else {
      // CREATE MODE
      var eventRootStore = null;
      if (siteId) {
        eventRootStore = getOrCreateSiteContainer(siteId, EVENTS_SITE_CONTAINER);
        visibility = "private";
      } else {
        eventRootStore = search.luceneSearch('+PATH:"/app:company_home/app:dictionary/app:event_scheduling/app:event_scheduling_events/."');
        if (eventRootStore.length == 1) {
          eventRootStore = eventRootStore[0];
        }
      }

      if (eventRootStore) {
        var yearFolder = getOrCreateFolder(eventRootStore, now.getFullYear());
        if (yearFolder) {
          var m = now.getMonth() + 1;
          var monthFolder = getOrCreateFolder(yearFolder, ((m >= 10) ? m : '0' + m), eventSchedulingUtils.getMessage('month.long.' + now.getMonth()));
          if (monthFolder) {
            eventNode = monthFolder.createNode("event-" + person.properties.userName + "-" + now.getTime(), "evtsched:event");
            eventNode.properties["evtsched:visibility"] = visibility;
          } else {
            status.setCode(status.STATUS_BAD_REQUEST, "Could not find month folder.");
            return;
          }
        } else {
          status.setCode(status.STATUS_BAD_REQUEST, "Could not find year folder.");
          return;
        }
      }
      else {
        status.setCode(status.STATUS_BAD_REQUEST, "Could not find events root store.");
        return;
      }
    }

    if (validityDate) {
      eventNode.properties["cm:to"] = validityDate;
    }

    eventNode.properties["cm:title"] = title;
    eventNode.properties["cm:description"] = description;
    eventNode.properties["evtsched:place"] = place;
    eventNode.properties["evtsched:lastUpdate"] = now;
    eventNode.save();

    // Known issue: "cm:versionable" aspect may be a problem
    if (eventNode.hasAspect("cm:versionable")) {
      eventNode.removeAspect("cm:versionable");
    }

    /** PERMISSIONS **/
    eventNode.setInheritsPermissions(false);
    addAuthoritiesToEvent(eventNode, authorities, visibility, siteId);

    /** DATES **/
    addDatesToEvent(eventNode, dates);

    /** MAIL NOTIFICATIONS **/
    if (mailNotification && visibility != "public") {
      // notify all event users
      notifyAllUsers(eventNode, "event_created");
    }
  }
  catch(e) {
    logger.log("Unexpected error occured." + e);
    status.setCode(status.STATUS_INTERNAL_SERVER_ERROR, "Unexpected error occured.");
    throw e;
  }
}

main();