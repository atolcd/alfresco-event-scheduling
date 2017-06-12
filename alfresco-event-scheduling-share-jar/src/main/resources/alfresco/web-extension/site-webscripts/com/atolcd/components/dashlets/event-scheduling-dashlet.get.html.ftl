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
<#assign id = args.htmlid>
<#assign jsid = args.htmlid?js_string>

<script type="text/javascript">//<![CDATA[
(function()
{
  var events = new Alfresco.dashlet.EventScheduling("${jsid}").setOptions({
    currentUser: "${user.name?js_string}",
    siteId: "${page.url.templateArgs.site!""}",
    canCreateEvent: ${canCreateEvent?string},
    maxItems: ${preferences.maxItemsFilter!'20'},
    range: "${preferences.rangeFilter!''}",
    visibility: <#if !page.url.templateArgs.site??>"${preferences.visibilityFilter!''}"<#else>{ value: "", classname: "hidden" }</#if>,
    path: "${preferences.pathFilter!'all'}"
  }).setMessages(${messages});

  new Alfresco.widget.DashletResizer("${jsid}", "${instance.object.id}");
  var refreshDashletEvent = new YAHOO.util.CustomEvent("refreshDashletClick");
  refreshDashletEvent.subscribe(events.onRefresh, events, true);

  <#if canCreateEvent>
    var createEventDashletEvent = new YAHOO.util.CustomEvent("createEventClick");
    createEventDashletEvent.subscribe(events.onCreateEventClick, events, true);
  </#if>

  new Alfresco.widget.DashletTitleBarActions("${jsid}").setOptions(
  {
    actions:
    [
      <#if canCreateEvent>
      {
        cssClass: "createEvent",
        id: "-create-event",
        eventOnClick: createEventDashletEvent,
        tooltip: "${msg("dashlet.create-event.tooltip")?js_string}"
      },
      </#if>
      {
        cssClass: "refresh",
        id: "-refresh",
        eventOnClick: refreshDashletEvent,
        tooltip: "${msg("dashlet.refresh.tooltip")?js_string}"
      }
    ]
  });
})();
//]]></script>

<div class="dashlet dashlet-events">
  <div class="title"><#if page.url.templateArgs.site??>${msg('header.inSite')}<#else>${msg('header')}</#if></div>
  <div class="toolbar flat-button">
    <!-- maxItems -->
    <input id="${id}-filter-maxItems" type="button" name="filter-maxItems" value="20" />
    <select id="${id}-filter-maxItems-menu">
       <option value="5">5</option>
       <option value="10">10</option>
       <option value="15">15</option>
       <option value="20">20</option>
       <option value="30">30</option>
       <option value="50">50</option>
    </select>

    <!-- rangeFilter -->
    <input id="${id}-filter-range" type="button" name="filter-range" value="${msg('filter.allTime')}" />
    <select id="${id}-filter-range-menu">
       <option value="">${msg("filter.allTime")}</option>
       <option value="today">${msg("filter.today")}</option>
       <option value="7">${msg("filter.7days")}</option>
       <option value="14">${msg("filter.14days")}</option>
       <option value="30">${msg("filter.30days")}</option>
       <option value="61">${msg("filter.2months")}</option>
       <option value="182">${msg("filter.6months")}</option>
    </select>

    <!-- visibilityFilter -->
    <input id="${id}-filter-visibility" type="button" name="filter-visibility" value="${msg('filter.visibility.all')}" />
    <select id="${id}-filter-visibility-menu">
       <option value="">${msg('filter.visibility.all')}</option>
       <option value="public">${msg('filter.visibility.public')}</option>
       <option value="private">${msg('filter.visibility.private')}</option>
    </select>

    <!-- pathFilter -->
    <input id="${id}-filter-path" type="button" name="filter-path" value="${msg('filter.all')}" />
    <select id="${id}-filter-path-menu">
      <option value="all">${msg('filter.all')}</option>
      <#if !page.url.templateArgs.site??>
      <option value="mySites">${msg('filter.mySites')}</option>
      </#if>
      <option value="createByMe">${msg('filter.createdByMe')}</option>
      <option value="archived">${msg('filter.archived')}</option>
    </select>
  </div>
  <div class="body scrollableList" <#if args.height??>style="height: ${args.height}px;"</#if>>
    <div class="events" id="${id}-events"></div>
  </div>
  <div class="ft footer">
    <div class="footer-left" id="${id}-footer">
      <div class="align-left" id="${id}-paginator">&nbsp;</div>
    </div>
    <div class="footer-atol">
      <a href="http://www.atolcd.com" target="_blank" title="Atol Conseils & Développements">
        <img src="${page.url.context}/res/components/dashlets/event-scheduling/images/atolcd.png" alt="Atol" />
      </a>
    </div>
  </div>
</div>