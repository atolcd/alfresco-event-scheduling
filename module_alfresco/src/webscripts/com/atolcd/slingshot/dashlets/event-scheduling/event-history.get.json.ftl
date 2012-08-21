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

<#escape x as jsonUtils.encodeJSONString(x)>
[
  <#if historyRoot??>
    <#list historyRoot.children as historyItem>
      {
        "type": "${historyItem.properties["evtsched:evtType"]!""}",
        "user": {
          "userName": "${historyItem.properties["evtsched:user"]}",
          "displayName": "${eventSchedulingUtils.getPersonFullName(historyItem.properties["evtsched:user"])}"
        },
        "created": "<@dateFormat historyItem.properties["cm:created"] />",
        "date": "<@dateFormat historyItem.properties["evtsched:evtDate"] />",
        "time": "${historyItem.properties["evtsched:evtTime"]!""}",
        "locale": "${historyItem.properties["sys:locale"]!""}"
      }
      <#if historyItem_has_next>,</#if>
    </#list>
  </#if>
]
</#escape>