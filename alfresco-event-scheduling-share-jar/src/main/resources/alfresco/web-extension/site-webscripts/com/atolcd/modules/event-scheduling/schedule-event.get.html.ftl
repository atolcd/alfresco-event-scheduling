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

<#assign el = args.htmlid?html />
<#assign visibility = eventInfo.visibility!"private" />
<#assign mode = args.mode!"create" />
<#assign inSite = (siteId?? && siteId?has_content) />
<#assign viewMode = (args.mode == "view") />
<#assign editMode = (args.mode == "edit") />
<#assign createMode = (args.mode == "create") />
<#assign tabindex = 0 />

<script type="text/javascript">//<![CDATA[
  Alfresco.util.addMessages(${messages}, "Alfresco.module.CreateOrEditEventScheduling");
//]]></script>

<div id="${el}" class="create-event-dialog">
  <div class="hd"><#if viewMode>${msg("label.header.view")}<#elseif editMode>${msg("label.header.edit")}<#else>${msg("label.header.create")}</#if></div>
  <div class="bd">
    <form id="${el}-form" action="" method="POST">
      <div class="yui-g">
        <div id="${el}-fields" class="fields-container left-pan">
          <input type="hidden" name="mode" value="${mode}" />
          <input type="hidden" name="nodeRef" value="${args.nodeRef!""}" />
          <#if inSite>
            <#assign visibility = "private" />
            <input type="hidden" name="siteId" value="${siteId!""}" />
          </#if>
          <div class="yui-gd">
            <label for="${el}-title">${msg("label.event.title")}:&nbsp;*</label>
            <input type="text" id="${el}-title" name="title" tabindex="${getTabIndex()}" class="hasTabIndex" size="80" value="${(eventInfo.title!"")?html}" <#if viewMode> readonly="readonly"</#if> />
          </div>
          <div class="yui-gd">
            <label for="${el}-place">${msg("label.event.place")}:</label>
            <input type="text" id="${el}-place" name="place" tabindex="${getTabIndex()}" class="hasTabIndex" size="80" value="${(eventInfo.place!"")?html}" <#if viewMode> readonly="readonly"</#if> />
          </div>
          <div class="yui-gd">
            <label for="${el}-description">${msg("label.event.description")}:</label>
            <textarea id="${el}-description" name="description" tabindex="${getTabIndex()}" class="hasTabIndex" rows="2" cols="60" <#if viewMode> readonly="readonly"</#if>>${(eventInfo.description!"")?html}</textarea>
          </div>
          <div class="yui-gd">
            <label for="${el}-validityDate" class="inline-label">${msg("label.event.validity")}:</label>
            <span id="${el}-container-validityDate">
              <input id="${el}-validityDate" type="text" name="validityDate" readonly="readonly" value="<#if eventInfo.validityDate?? && eventInfo.validityDate?has_content>${eventInfo.validityDate.displayDate}</#if>" title="" class="datepicker-date" />
              <input id="${el}-validityDate-iso" type="hidden" name="validityDate-iso" value="<#if eventInfo.validityDate?? && eventInfo.validityDate?has_content>${eventInfo.validityDate.isoDate}</#if>" />
            </span>
          </div>
          <div class="yui-gd">
            <label for="${el}-visibility">${msg("label.visibility")}:</label>
            <select id="${el}-visibility" name="visibility" tabindex="${getTabIndex(1)}" class="hasTabIndex" <#if viewMode || editMode || inSite> disabled="disabled"</#if>>
              <option value="public" <#if visibility == "public">selected="selected"</#if>>${msg("label.public")}</option>
              <option value="private" <#if visibility == "private">selected="selected"</#if>>${msg("label.private")}</option>
            </select>
          </div>

          <fieldset id="${el}-private-options" class="yui-gd <#if visibility != "private">hidden</#if>">
            <span id="${el}-addUserGroupButton" class="add-user-group yui-button yui-push-button">
               <span class="first-child">
                  <button tabindex="${getTabIndex()}" class="hasTabIndex">${msg("button.add-user-group")}</button>
               </span>
            </span>
            <legend>${msg("label.private-options")}:</legend>
            <div>
              <label>${msg("label.authorities")}:&nbsp;*</label>
            </div>

            <#assign authorities = "" />
            <div class="yui-gd">
              <div id="${el}-authorities-selected">
                <#if eventInfo.authorities?exists && eventInfo.authorities?size &gt; 0>
                  <#list eventInfo.authorities as authority>
                    <@renderAuthoritySelected authority />

                    <#assign authorities = authorities + authority.authorityName />
                    <#if authority_has_next>
                      <#assign authorities = authorities + "," />
                    </#if>
                  </#list>
                </#if>
              </div>
              <input type="hidden" id="${el}-authorities" name="authorities" value="${authorities}" />
            </div>

            <div class="yui-gd">
              <label for="${el}-mail-notification" class="inline-label">${msg("label.mail-notification")}:</label>
              <input type="checkbox" id="${el}-mail-notification" name="mail-notification" tabindex="${getTabIndex()}" class="hasTabIndex" <#if viewMode || editMode> disabled="disabled"<#elseif createMode> checked="checked"</#if>/>
            </div>
          </fieldset>

          <fieldset id="${el}-dates-container" class="dates-container yui-gd">
            <legend>${msg("label.dates")}:</legend>
            <span id="${el}-add-date" class="yui-button yui-push-button add-date">
               <span class="first-child">
                  <button tabindex="${getTabIndex()}" class="hasTabIndex">${msg("button.add-date")}</button>
               </span>
            </span>
            <#if eventInfo.dates?exists && eventInfo.dates?size &gt; 0>
              <#list eventInfo.dates as d>
                <@renderDatePicker d_index d viewMode />
              </#list>
            <#else>
              <@renderDatePicker 0 "" viewMode />
            </#if>
          </fieldset>
        </div>
        <div class="right-pan">
          <div id="${el}-authorityFinder" class="authority-finder-container"></div>
        </div>
      </div>
      <div class="separator">&nbsp;</div>
      <div class="bdft <#if viewMode>hidden</#if>">
        <input type="submit" id="${el}-ok" value="${msg('button.ok')}" />
        <input type="button" id="${el}-cancel" value="${msg('button.cancel')}" />
      </div>
    </form>
  </div>
</div>

<#macro renderAuthoritySelected authority>
  <div class="authority <#if authority.authorityName?starts_with("GROUP_")>group<#else>user</#if>" name="${authority.authorityName}">${authority.displayName}</div>
</#macro>

<#macro renderDatePicker id date readonly>
  <div class="date yui-gd">
    <span id="${el}-container-date${id}">
      <label for="${el}-date${id}" class="inline-label">${msg("label.date")}:&nbsp;*</label>
      <input id="${el}-date${id}" type="text" name="date${id}" readonly="readonly" value="<#if date?? && date?has_content>${date.displayDate}</#if>" title="" class="datepicker-date" />
      <#if createMode><input id="${el}-date${id}-iso" type="hidden" name="date${id}-iso" value="<#if date?? && date?has_content>${date.isoDate}</#if>" /></#if></span>
    <span id="${el}-container-datetime${id}">
      <label for="${el}-datetime${id}" class="inline-label">${msg("label.at")}</label>
      <input id="${el}-datetime${id}" name="datetime${id}" tabindex="${getTabIndex(1)}" value="<#if date?? && date?has_content>${date.time}</#if>" type="text" size="10" class="datepicker-time hasTabIndex" <#if readonly> readonly="readonly"</#if> <#if editMode> disabled="disabled"</#if> />
    </span>
  </div>
</#macro>

<#function getTabIndex offset=0>
  <#assign tabindex = tabindex + 1 + offset />
  <#return tabindex>
</#function>