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

<div class="answer-event">
  <#if nodeRef?? && item??>
    <#assign id = args.htmlid>
    <#assign jsid = args.htmlid?js_string>

    <script type="text/javascript">//<![CDATA[
    (function()
    {
      var opts = {
        currentUser: "${user.name?js_string}",
        nodeRef: "${nodeRef}",
        rowsPerPage: 50,
        userColumnWidth: 400,
        eventDetails: ${item}
      };

      new Alfresco.module.AnswerEventDialog("${jsid}").setOptions(opts).setMessages(${messages}).show();
    })();
    //]]></script>

    <div class="standalone-title">
      ${msg("label.answer-event.to")} '${eventTitle!""}'
    </div>
    <div>
      <div class="event-details-container">
        <div class="event-details yui-gd">
          <div id="${id}-event-details-left" class="left"></div>
          <div id="${id}-event-details-right" class="right"></div>
        </div>
        <div id="${id}-datatable"></div>
        <div id="${id}-datatable-participants-count" class="participants-count"></div>
        <div id="${id}-datatable-pagination"></div>
      </div>
    </div>
  <#else>
    <div class="status-banner theme-bg-color-2 theme-border-4">
      ${msg("banner.event.not-found")}
    </div>
  </#if>
</div>