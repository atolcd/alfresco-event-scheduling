<#--
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
-->
<#macro dateFormat date>${xmldate(date)}</#macro>

<#macro eventJSON event detailed=false>
  <#assign siteId = event.node.getSiteShortName()!"" />
  <#escape x as jsonUtils.encodeJSONString(x)>
  {
    "nodeRef": "${event.node.nodeRef}",
    "title": "${event.node.properties["cm:title"]!""}",
    "description": "${event.node.properties["cm:description"]!""}",
    "siteId": <#if siteId?has_content>"${siteId}", "siteTitle": "${eventSchedulingUtils.getSiteTitle(siteId)!""}"<#else>null</#if>,
    "isArchived": ${event.node.properties["evtsched:archived"]?string},
    "isLocked": ${(event.node.properties["evtsched:locked"]!"false")?string},
    "visibility": "${event.node.properties["evtsched:visibility"]}",
    "createdBy": "${event.createdBy!""}",
    "createdByUser": "${event.createdByUser!""}",
    "createdOnISO": "<@dateFormat event.node.properties["cm:created"] />",
    "modifiedOnISO": "<@dateFormat event.lastUpdate />",
    <#if event.node.properties["cm:to"]??>
    "validityDate": {
      "displayDate": "${event.node.properties["cm:to"]?date?string("EEEE, dd MMMM, yyyy")?capitalize}",
      "isoDate": "<@dateFormat event.node.properties["cm:to"] />"
    },
    </#if>
    "participants": ${event.participants?c},
    "participated": ${event.participated?string},
    "respondedToAll": ${event.respondedToAll?string},
    "isOwner": ${event.isOwner?string}
    <#if detailed>,
      "name": "${event.node.name}",
      "place": "${event.node.properties["evtsched:place"]!""}",
      "authorities": [
        <#list event.authorities as authority>
          {
            "authorityName": "${authority.authorityName}",
            "displayName": "${getAuthorityDisplayName(authority, siteId)}"
          }
          <#if authority_has_next>,</#if>
        </#list>
      ],
      "dates": [
        <#list event.dates?sort_by("date") as d>
          {
            "displayDate": "${d.date?date?string("EEEE, dd MMMM, yyyy")?capitalize}",
            "isoDate": "<@dateFormat d.date />",
            "time": "${d.time}",
            "nodeRef": "${d.nodeRef}"
          }
          <#if d_has_next>,</#if>
        </#list>
      ]
    </#if>
  }
  </#escape>
</#macro>

<#function getAuthorityDisplayName authority site>
  <#if !(authority.authorityName?starts_with("GROUP_site_"))>
    <#return authority.displayName!authority.authorityName />
  <#else>
    <#if authority.authorityName == ("GROUP_site_" + site)>
      <#return eventSchedulingUtils.getMessage("message.AllSiteMembers", site) />
    </#if>

    <#return eventSchedulingUtils.getMessage("message." + authority.authorityName?split("GROUP_site_" + site + "_")?last, site) />
  </#if>
</#function>