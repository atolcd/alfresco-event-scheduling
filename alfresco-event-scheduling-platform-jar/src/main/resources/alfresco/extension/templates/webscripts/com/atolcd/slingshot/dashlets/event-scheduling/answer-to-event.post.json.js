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
  "eventNodeRef": "workspace://SpacesStore/30a239f5-6771-4521-8851-25ad23255b1e",
  "dateNodeRef": "workspace://SpacesStore/b2e1d12e-5784-4a0c-bd63-57a6e87a9ba0",
  "newData": "false",
  "oldData": null
}
*/

function main() {
  try {
    if (json.has("eventNodeRef") && json.has("dateNodeRef") && json.has("newData")) {
      var eventNode = search.findNode(json.get("eventNodeRef").toString());
      if (eventNode) {
        var dateNode = search.findNode(json.get("dateNodeRef").toString());
        if (dateNode) {
          var respStr = "";
          if (!json.isNull("newData")) {
            respStr = new String(json.get("newData")).toString();
          }

          var userName = person.properties.userName,
              answerType = "user-answer",
              responseNode = null;

          var nodes = dateNode.childrenByXPath("./*[@cm:name='" + userName + "']"); // childByNamePath not always works...
          if (nodes.length > 0) {
            responseNode = nodes[0];
            if (nodes.length > 1) { /* WARN: it should not be possible */ }
          }

          if (responseNode && !respStr) {
            // delete response
            answerType = "user-delete-answer";
            responseNode.remove();
          } else if (responseNode && respStr) {
            // update response (metadata)
            answerType = "user-change-answer";
            responseNode.properties["evtsched:response"] = (respStr == "true");
            responseNode.save();
          } else if (!responseNode && respStr) {
            // create response node
            var props = new Array(1);
            props["evtsched:response"] = (respStr == "true");
            responseNode = dateNode.createNode(userName, "evtsched:response", props, "evtsched:responses");
          } else { /* nothing to do */ }

          // Debug
          // logger.log("response" + responseNode);

          // add history item
          if (dateNode.typeShort == "evtsched:eventDate") {
            addHistoryItem(eventNode, userName, answerType, dateNode.properties["evtsched:date"]);
          } else if (dateNode.typeShort == "evtsched:eventTime") {
            addHistoryItem(eventNode, userName, answerType, dateNode.parent.properties["evtsched:date"], dateNode.properties["cm:title"] || dateNode.name);
          }

          // update 'last update' property
          updateLastEventActivity(eventNode, new Date());
        } else {
          status.setCode(status.STATUS_BAD_REQUEST, "Could not find date node.");
          return;
        }
      } else {
        status.setCode(status.STATUS_BAD_REQUEST, "Could not find event node.");
        return;
      }
    } else {
      status.setCode(status.STATUS_BAD_REQUEST, "Missing parameters");
      return;
    }
  }
  catch(e) {
    logger.log("Unexpected error occured." + e);
    status.setCode(status.STATUS_INTERNAL_SERVER_ERROR, "Unexpected error occured.");

    throw e;
  }
}

main();