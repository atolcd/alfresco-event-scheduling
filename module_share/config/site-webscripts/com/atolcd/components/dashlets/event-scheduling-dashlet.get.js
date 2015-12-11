/*
 * Copyright (C) 2012 Atol Conseils et D�veloppements.
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

var PREFERENCES_ROOT = "com.atolcd.share.dashlet.eventScheduling";

var EventSchedulingDefaultGroups = [ "SiteManager" ];

// Load different preference if we are on a site
if (page.url.templateArgs.site) {
  PREFERENCES_ROOT += ".site";
}

function main() {
  var result, preferences = {}, canCreateEvent = false;

  // Request the current user's preferences
  var result = remote.call("/api/people/" + stringUtils.urlEncode(user.name) + "/preferences?pf=" + PREFERENCES_ROOT);
  if (result.status == 200 && result != "{}") {
    var prefs = eval('(' + result + ')');
    try {
      // Populate the preferences object literal for easy look-up later
      preferences = eval('(prefs.' + PREFERENCES_ROOT + ')');
      if (typeof preferences != "object") {
        preferences = {};
      }
    }
    catch (e) {}
  }
  model.preferences = preferences;

  if (page.url.templateArgs.site) {
    // We are in the context of a site, so call the repository to see if the user is site manager or not
    var json = remote.call("/api/sites/" + page.url.templateArgs.site + "/memberships/" + encodeURIComponent(user.name));
    if (json.status == 200) {
      var obj = eval('(' + json + ')');
      if (obj) {
    	  var groups;
    	  if(config.scoped["EventScheduling"] && config.scoped["EventScheduling"].groups) {
             if (logger.isLoggingEnabled())
             {
                logger.log('EventScheduling: loading configuration from share-config');
             }             
             groups = config.scoped["EventScheduling"].groups.getChildren("group");
          } else {
        	  if (logger.isLoggingEnabled())
              {
                 logger.log('EventScheduling: loading default configuration');
              }
        	  groups = EventSchedulingDefaultGroups
          } 
    	  if (groups) {
	    	  for (var j = 0; j < groups.size(); j++)
	          {
	          	if(String(groups.get(j).getValue()) === String(obj.role)) {
	          		canCreateEvent = true;
	          		break;
	          	}	              
	          }
	      }
       }
    }
  }
  else if (user.isAdmin) {
    canCreateEvent = true;
  }
  else {
    var json = remote.call("/api/repository/groups/is-group-member?group=GROUP_EVENT_SCHEDULED_CREATORS");
    if (json.status == 200) {
      var obj = eval('(' + json + ')');
      if (obj) {
        canCreateEvent = obj.isMember;
      }
    }
  }

  model.canCreateEvent = canCreateEvent;
}

main();