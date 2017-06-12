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


function main() {
  model.userToProcess = 0;
  model.successCount = 0;

  try {
    var storeType = url.templateArgs.store_type,
        storeId = url.templateArgs.store_id,
        id = url.templateArgs.id;
    var templateName = args.templateName;

    if (storeType && storeId && id && templateName) {
      var nodeRef = storeType + "://" + storeId + "/" + id;
      var eventNode = search.findNode(nodeRef);
      if (eventNode) {
        // be sure that it's the event owner that send mail
        if (eventNode.getOwner() == person.properties.userName) {
          if (url.templateArgs.userToNotify) {
            try {
              model.userToProcess ++;
              notifyUser(eventNode, url.templateArgs.userToNotify, templateName, false);
              model.successCount ++;
            } catch(e) {
              logger.log("An error occurred while sending mail to user : " + url.templateArgs.userToNotify);
              status.setCode(status.STATUS_INTERNAL_SERVER_ERROR , e);
            }
          } else {
            var res = notifyAllUsers(eventNode, templateName);
            model.userToProcess = res.userCount;
            model.successCount = res.successCount;
          }
        } else {
          status.setCode(status.STATUS_UNAUTHORIZED , "You're not authorized to perform this action.");
        }
      } else {
        status.setCode(status.STATUS_NOT_FOUND, "Node " + nodeRef + " does not exists.");
      }
    } else {
      status.setCode(status.STATUS_BAD_REQUEST, "Missing parameters");
    }
  }
  catch(e) {
    logger.log("Unexpected error occured." + e);
    status.setCode(status.STATUS_INTERNAL_SERVER_ERROR, "Unexpected error occured.");
    throw e;
  }
}

main();