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

const EVENTS_SITE_CONTAINER = "scheduledEvents";
const SITES_SPACE_QNAME_PATH = "/app:company_home/st:sites/";
const EVENT_SCHEDULING_REPOSITORY_SPACE_QNAME_PATH = "/app:company_home/app:dictionary/app:event_scheduling/app:event_scheduling_events/";

function getEventDateFolderName(_date) {
  var d = _date.getDate();
  var m = _date.getMonth() + 1;
  var y = _date.getYear() + 1900;

  return y + "-" + ((m >= 10) ? m : '0' + m) + "-" + ((d >= 10) ? d : '0' + d);
}


function sortByLastUpdate(a, b) {
  return b.properties["evtsched:lastUpdate"].getTime() - a.properties["evtsched:lastUpdate"].getTime();
}


function getOrCreateFolder(parent, childName, childTitle, type, assocType) {
  var node = null;

  var nodes = parent.childrenByXPath("./*[@cm:name='" + childName + "']"); // childByNamePath not always works...
  if (nodes.length > 0) {
    node = nodes[0];
    if (nodes.length > 1) { /* WARN: it should not be possible */ }
  }

  if (!node) {
    if (type) {
      if (assocType) {
        node = parent.createNode(childName, type, assocType);
      } else {
        node = parent.createNode(childName, type);
      }
    } else {
      node = parent.createFolder(childName);
    }

    if (childTitle) {
      node.properties["cm:title"] = childTitle;
      node.save();
    }
  }
  return node;
}


function getOrCreateSiteContainer(siteId, containerId) {
  var containerNode = null;

  var siteNode = siteService.getSite(siteId);
  if (siteNode) {
    containerNode = siteNode.getContainer(containerId);
    if (containerNode === null) {
      containerNode = siteNode.createContainer(containerId);
    }

    if (!containerNode) {
      // TODO: throw error
      status.setCode(status.STATUS_NOT_FOUND, "Container '" + containerId + "' not found in '" + siteId + "'. (No permission?)");
    }
  } else {
    // TODO: throw error
    status.setCode(status.STATUS_NOT_FOUND, "Site not found: '" + siteId + "'");
  }

  return containerNode;
}


function updateLastEventActivity(eventNode, date) {
  // update 'last update' property
  eventSchedulingUtils.runAsSystem(function(){
    // Known issue: "cm:versionable" aspect may be a problem
    if (eventNode.hasAspect("cm:versionable")) {
      eventNode.removeAspect("cm:versionable");
    }

    eventNode.properties["evtsched:lastUpdate"] = date;
    eventNode.save();
  });
}


function addHistoryItem(eventNode, userName, eventType, eventDate, eventTime) {
  eventSchedulingUtils.runAsSystem(function(){
    var historyRootNode = getHistoryRootNode(eventNode);
    if (historyRootNode) {
      var props = new Array(4);
      props['evtsched:evtType'] = eventType;
      props['evtsched:evtDate'] = eventDate;
      props['evtsched:user'] = userName;

      if (eventTime) {
        props['evtsched:evtTime'] = eventTime;
      }

      historyRootNode.createNode('historyItem-' + userName + '-' + new Date().getTime(), 'evtsched:historyItem', props);

      // Known issue: "cm:versionable" aspect may be a problem
      if (historyRootNode.hasAspect("cm:versionable")) {
        historyRootNode.removeAspect("cm:versionable");
      }
    }
  });
}

function getHistoryRootNode(eventNode) {
  var assocs = eventNode.childAssocs['evtsched:history'];
  if (!assocs) {
    assocs = [eventNode.createNode('history', 'cm:systemfolder', null, 'evtsched:history')];
  }

  if (assocs.length > 1) {
    logger.log("Too many 'evtsched:history' child associations on node : " + eventNode.nodeRef.toString());
  }

  return assocs[0];
}


function notifyUser(eventNode, userName, templateName, ignore_erros) {
  var recipient = people.getPerson(userName);
  var sender = people.getPerson(eventNode.getOwner());
  if (recipient && recipient.properties["cm:email"] != null) {
    // create mail action
    var mail = actions.create("mail");
    mail.parameters.to = recipient.properties["cm:email"];
    mail.parameters.from = sender.properties["cm:email"];

    mail.parameters.subject = eventSchedulingUtils.getMessage("message.mail." + templateName + ".subject", eventNode.properties["cm:title"] || "") || eventNode.properties["cm:title"];
    mail.parameters.text = eventSchedulingUtils.getMessage("message.mail." + templateName + ".text") || "";
    mail.parameters.html = true;
    mail.parameters.ignore_send_failure = (ignore_erros == false) ? ignore_erros : true;
    mail.parameters.send_after_commit = (ignore_erros == false) ? ignore_erros : true;
    mail.parameters.template_model = {
      recipient: userName,
      recipientFirstName: recipient.properties["cm:firstName"]
    };

    // Find template
    var emailTemplatesRoot = search.luceneSearch('+PATH:"/app:company_home/app:dictionary/app:event_scheduling/app:event_scheduling_email_templates/."');
    if (emailTemplatesRoot && emailTemplatesRoot.length == 1 ) {
      var templateFullName = eventSchedulingUtils.getMessage("template." + templateName) || (templateName + "_email.ftl");
      mail.parameters.template = emailTemplatesRoot[0].childByNamePath(templateFullName);

      if (!mail.parameters.template) {
        logger.log("Failed to find email template '" + templateFullName + "'.");
      }
      // execute action against the event
      mail.execute(eventNode);
    } else {
      logger.log("Failed to find email template root, notification cannot be sent.");
    }
  } else {
    logger.log("User '" + userName + "' has an invalid email address, notification cannot be sent.");
  }
}


function notifyAllUsers(eventNode, templateName) {
  var count = 0,
      successCount = 0;

  var allParticipants = getEventParticipants(eventNode).allParticipants;
  for (var participant in allParticipants) {
    count ++;
    try {
      // debug
      // logger.log("Sending notification to user : " + participant);
      notifyUser(eventNode, participant, templateName);
      successCount ++;
    } catch(e) {
      logger.log("An error occurred while sending mail to user : " + participant);
    }
  }

  return {
    userCount: count,
    successCount: successCount
  };
}


function getEventItem(node) {
  var item = {
    node: node,
    isOwner: (node.getOwner() == person.properties.userName), // (node.hasPermission("Coordinator") || node.hasPermission("SiteManager") || (node.getOwner() == person.properties.userName)),
    lastUpdate: node.properties["evtsched:lastUpdate"] || node.properties["cm:modified"],
    createdOn: node.properties["cm:created"],
    createdByUser: node.properties["cm:creator"]
  };
  item.createdBy = getPersonDisplayName(item.createdByUser);

  // participants
  item.participants = 0;
  item.authorities = [];
  if (node.properties["evtsched:visibility"] == "private") {
    var participants = getEventParticipants(node);
    item.participants = participants.count;
    item.authorities = participants.authoritiesInvited;
  }

  var dates = getEventDates(node);
  item.dates = dates.dates;
  item.participated = (dates.participations > 0);
  item.respondedToAll = (dates.dates.length == dates.participations);

  return item;
}


function addDatesToEvent(eventNode, dates) {
  for (var date in dates) {
    var dateDetails = dates[date];
    var dateFolder = getOrCreateFolder(eventNode, date, dateDetails.title, "evtsched:eventDate", "evtsched:dates");
    if (dateFolder) {
      dateFolder.properties["evtsched:date"] = dateDetails.date;
      dateFolder.save();
      for (var i=0, ii=dateDetails.schedules.length ; i<ii ; i++) {
        var folderName = replaceCharacters(dateDetails.schedules[i], '_'); // Escape characters
        var schedule = getOrCreateFolder(dateFolder, folderName, dateDetails.schedules[i], "evtsched:eventTime", "evtsched:times");
      }
    }
  }
}

function replaceCharacters(str, c) {
  return (str+'').replace(/([?*\\\/|:])/g, c);
}

function addAuthoritiesToEvent(eventNode, authorities, visibility, siteId) {
  var currentUser = person.properties.userName;
  if (siteId) {
    eventNode.setPermission("SiteManager", currentUser);
    for (var i=0, ii=authorities.length ; i<ii ; i++) {
      if (currentUser != authorities[i]) {
        eventNode.setPermission("SiteContributor", authorities[i]);
      }
    }
  }
  else {
    eventNode.setPermission("Coordinator", currentUser);
    if (visibility == "public") {
      eventNode.setPermission("Contributor", "GROUP_EVERYONE");
    } else {
      for (var i=0, ii=authorities.length ; i<ii ; i++) {
        if (currentUser != authorities[i]) {
          eventNode.setPermission("Contributor", authorities[i]);
        }
      }
    }
  }
}


function getEventDates(eventNode) {
  var datesTab = [];

  var dateNodes = eventNode.childAssocs["evtsched:dates"] || [];
  for (var i=0, ii=dateNodes.length ; i<ii ; i++) {
    var dateNode = dateNodes[i],
        date = dateNode.properties["evtsched:date"];

    var scheduleNodes = dateNode.childAssocs["evtsched:times"] || [];
    if (scheduleNodes.length == 0) {
      datesTab.push({
        date: date,
        time: "",
        nodeRef: dateNode.nodeRef.toString()
      });
    } else {
      for (var j=0, jj=scheduleNodes.length ; j<jj ; j++) {
        var timeNode = scheduleNodes[j];
        datesTab.push({
          date: date,
          time: timeNode.properties["cm:title"] || timeNode.name, // Node name may have been modified (?, *,\, /, |, :)
          nodeRef: timeNode.nodeRef.toString()
        });
      }
    }
  }

  // participated ?
  var userResponses = search.luceneSearch('EXACTTYPE:"evtsched:response" AND PATH:"' + eventNode.qnamePath + '//*" AND @cm\\:name:"' + search.ISO9075Encode(person.properties.userName) + '"');

  return {
    dates: datesTab,
    participations: userResponses.length
  };
}


function getEventParticipants(eventNode) {
  var tokens, authorityId, role, allParticipants = {},
      count = 0, authoritiesInvitedObjTmp = {}, authoritiesInvited = [],
      perms = eventNode.getPermissions(); // ALLOWED;kevinr;Consumer

  for (var i=0, ii=perms.length ; i<ii ; i++) {
    tokens = perms[i].split(";");
    authorityId = tokens[1];
    role = tokens[2];

    if (tokens[0] == "ALLOWED" && (role == "Coordinator" || role == "SiteManager" || role == "Contributor" || role == "SiteContributor")) {
      if (authorityId.indexOf("GROUP_") === 0) {
        var group = people.getGroup(authorityId);
        if (group) {
          if (role == "Contributor" || role == "SiteContributor") {
            if (!authoritiesInvitedObjTmp[authorityId]) {
              authoritiesInvited.push({
                authorityName: authorityId,
                displayName: group.properties["cm:authorityDisplayName"]
              });
            }
          }

          var users = people.getMembers(group, true); //recurse
          for (var j=0, jj=users.length ; j<jj ; j++) {
            var usr = users[j];
            if (!allParticipants[usr.properties.userName]) {
              allParticipants[usr.properties.userName] = true;
              count ++;
            }
          }
        }
      }
      else {
        if (role == "Contributor" || role == "SiteContributor") {
          if (!authoritiesInvitedObjTmp[authorityId]) {
            authoritiesInvited.push({
              authorityName: authorityId,
              displayName: getPersonDisplayName(authorityId)
            });
          }
        }

        if (!allParticipants[authorityId]) {
          allParticipants[authorityId] = true;
          count ++;
        }
      }
    }
  }

  return {
    count: count,
    allParticipants: allParticipants,
    authoritiesInvited: authoritiesInvited
  };
}


/**
 * Returns person display name string as returned to the user.
 *
 * Caches the person full name to avoid repeatedly querying the repository.
 */
var personDataCache = {};
function getPersonDisplayName(userId) {
  if (typeof personDataCache[userId] === "object") {
    return personDataCache[userId];
  }

  var displayName = eventSchedulingUtils.getMessage("user.does.not.exists", userId) || "";
  var person = people.getPerson(userId);
  if (person != null) {
    displayName = person.properties.firstName + " " + person.properties.lastName;
  }
  personDataCache[userId] = displayName;
  return displayName;
}