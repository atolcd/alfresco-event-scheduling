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

try {
  // construct the NodeRef from the URL
  var nodeRef = url.templateArgs.store_type + "://" + url.templateArgs.store_id + "/" + url.templateArgs.id;
  var eventNode = search.findNode(nodeRef);
  if (eventNode) {
    var dates = getDates(eventNode),
        datesRef = dates.nodeRef,
        users = new Array();

    // list participants for private events
    if (eventNode.properties["evtsched:visibility"] == "private") {
      var participants = getEventParticipants(eventNode);
      for (var participant in participants.allParticipants) {
        if (!users[participant]) {
          users[participant] = getEmptyResponse(datesRef, participant);
        }
      }
    } else {
      // add current user for public events
      users[person.properties.userName] = getEmptyResponse(datesRef, person.properties.userName);
    }

    // retrieves responses
    for (var i=0, ii=datesRef.length ; i<ii ; i++) {
      var node = datesRef[i],
          responses = node.childAssocs["evtsched:responses"] || [];

      for (var j=0, jj=responses.length ; j<jj ; j++) {
        var responseNode = responses[j],
            userName = responseNode.name;
        if (!users[userName]) {
          users[userName] = getEmptyResponse(datesRef, userName);
        }

        if (!users[userName][node.id]) {
          users[userName][node.id] = responseNode.properties["evtsched:response"];
        } else {
          logger.log(userName + " has already response on node : " + node.nodeRef);
        }
      }
    }

    model.dates = dates.dates;
    model.datesRef = datesRef;
    model.users = users;
  }
}
catch(e) {
}


function getDates(eventNode) {
  var datesTab = {};
  var fields = [];

  var dateNodes = eventNode.childAssocs["evtsched:dates"] || [];
  dateNodes.sort(ascSortByDate);
  for (var i=0, ii=dateNodes.length ; i<ii ; i++) {
    var dateNode = dateNodes[i],
        date = dateNode.properties["evtsched:date"];

    var monthId = date.getFullYear() + '-' + (((date.getMonth() + 1) < 10) ? ('0' + (date.getMonth() + 1)) : (date.getMonth() + 1).toString());
    if (!datesTab[monthId]) {
      datesTab[monthId] = [];
    }

    var d = (date.getDate() < 10) ? ('0' + date.getDate()) : date.getDate().toString();
    var tabSize = datesTab[monthId].push({
      "id": dateNode.id,
      "label": d,
      "times": []
    });

    var scheduleNodes = dateNode.childAssocs["evtsched:times"] || [];
    if (scheduleNodes.length == 0) {
      fields.push(dateNode);
    }
    else {
      for (var j=0, jj=scheduleNodes.length ; j<jj ; j++) {
        var timeNode = scheduleNodes[j];

        fields.push(timeNode);
        datesTab[monthId][tabSize - 1].times.push({
          "id": timeNode.id,
          "label": timeNode.properties["cm:title"] || timeNode.name // Node name may have been modified (?, *,\, /, |, :)
        });
      }
    }
  }

  // Debug
  // logger.log(jsonUtils.toJSONString(datesTab));

  return {
    "nodeRef": fields,
    "dates": datesTab
  };
}

function getEmptyResponse(nodesTab, userId) {
  var tmpObj = new Array();
  for (var k=0, kk=nodesTab.length ; k<kk ; k++) {
    tmpObj[nodesTab[k].id] = null;
  }

  tmpObj.user = {
    "userName": userId,
    "displayName": getPersonDisplayName(userId),
    "exists": (people.getPerson(userId) != null)
  }

  return tmpObj;
}

function ascSortByDate(a, b) {
  return a.properties["evtsched:date"].getTime() - b.properties["evtsched:date"].getTime();
}