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

<#import "lib/event.scheduling.lib.ftl" as eventSchedulingLib />
<#import "/org/alfresco/repository/generic-paged-results.lib.ftl" as genericPaging />

{
  "data":
  [
    <#list events.items?sort_by("lastUpdate")?reverse as event>
      <@eventSchedulingLib.eventJSON event=event />
      <#if event_has_next>,</#if>
    </#list>
  ],
  "paging":
  {
    "maxItems": ${events.pageSize?c},
    "skipCount": ${events.startIndex?c},
    "totalItems": ${events.total?c},
    "totalItemsRangeEnd": null,
    "confidence": "exact"
  }
}