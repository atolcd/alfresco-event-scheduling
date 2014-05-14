<import resource="classpath:alfresco/extension/templates/webscripts/com/atolcd/slingshot/dashlets/event-scheduling/lib/event.scheduling.lib.js">
<import resource="classpath:alfresco/templates/webscripts/org/alfresco/repository/generic-paged-results.lib.js">

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
  var i, ii,
      events = [],
      maxItems = parseInt(args.maxItems, 10),
      range = args.range || "",
      visibility = args.visibility || "",
      pathFilter = args.path || "all";

  var query = 'EXACTTYPE:"evtsched:event"';

  var siteId = url.templateArgs.site;
  if (siteId) {
    // site only
    var sitePath = SITES_SPACE_QNAME_PATH + 'cm:' + search.ISO9075Encode(siteId) + '/cm:' + EVENTS_SITE_CONTAINER + '//*';
    query += ' AND PATH:"' + sitePath + '"';
  }
  else if (pathFilter == "mySites") {
    // all the sites
    var sitesPath = SITES_SPACE_QNAME_PATH + '*/cm:' + EVENTS_SITE_CONTAINER + '//*';
    query += ' AND PATH:"' + sitesPath + '"';
  }
  else {
    // all
    var repoPath = EVENT_SCHEDULING_REPOSITORY_SPACE_QNAME_PATH + '/*';
    var sitesPath = SITES_SPACE_QNAME_PATH + '*/cm:' + EVENTS_SITE_CONTAINER + '//*';

    query += ' AND (PATH:"' + repoPath + '" OR PATH:"' + sitesPath + '")';
  }

  if (range != "") {
    var from, to;
    if(isNaN(range)) {
      // today
      from = new Date(); from.setHours(0); from.setMinutes(0); from.setSeconds(0);
      to = new Date(); to.setHours(23); to.setMinutes(59);  to.setSeconds(59);
    } else {
      // period
      to = new Date();
      from = new Date(to.getTime() - (parseInt(range, 10) * 24 * 60 * 60 * 1000));
    }
    query += ' AND @evtsched\\:lastUpdate:[' + utils.toISO8601(from) + ' TO ' + utils.toISO8601(to) + ']';
  }

  if (visibility != ""){
    query += ' AND @evtsched\\:visibility:"' + visibility + '"';
  }

  if (pathFilter == "createByMe") {
    query += ' AND @cm\\:creator:"' + search.ISO9075Encode(person.properties.userName) + '"';
  }

  if (pathFilter == "archived") {
    query += ' AND @evtsched\\:archived:true';
  } else {
    query += ' AND @evtsched\\:archived:false';
  }

  // Debug
  // logger.log("query: " + query);

  // @param index: the start index from which results should be returned
  // @param count: the number of elements that should be returned
  var index = parseInt(args.skipCount, 10) || 0;
  var count = parseInt(args.pageSize, 10);

  // var nodes = search.luceneSearch(query, 'evtsched:lastUpdate', false, maxItems); // XXX: does not work properly
  var nodes = search.luceneSearch(query);
  nodes.sort(sortByLastUpdate);
  nodes = nodes.slice(0, maxItems); // To be sure to have the last updated events

  return getPagedResultsData(nodes, index, count, getEventItem);
}

model.events = main();