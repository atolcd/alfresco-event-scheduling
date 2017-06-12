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

<#escape x as jsonUtils.encodeJSONString(x)>
{
  "columnDefs" : [
    {
      "key": "user"
    }
    <#if dates?size &gt; 0>
      ,<#list dates?keys?sort as mkey>
        {
          "label": "${mkey}",
          "type": "month",
          "children": [
            <#assign month = dates[mkey] />
            <#list month as date>
              <#if date.times?size &gt; 0>
                {
                  "label": "${date.label}",
                  "type": "date",
                  "children": [
                    <#list date.times as time>
                      {
                        "key": "${time.id}",
                        "label": "${time.label}",
                        "type": "time"
                      }
                      <#if time_has_next>,</#if>
                    </#list>
                  ]
                }
              <#else>
                {
                  "key": "${date.id}",
                  "label": "${date.label}",
                  "type": "date"
                }
              </#if>

              <#if date_has_next>,</#if>
            </#list>
          ]
        }
        <#if mkey_has_next>,</#if>
      </#list>
    </#if>
  ],
  "fields": [
    "user"
    <#list datesRef as node>, "${node.id}"</#list>
  ],
  "data" : [
    <#list users?keys as user>
      <#assign userprops = users[user] />
      <@displayHash hash=userprops />
      <#if user_has_next>,</#if>
    </#list>
  ]
}
</#escape>

<#macro displayHash hash>
  <#escape x as jsonUtils.encodeJSONString(x)>
  {
    <#list hash?keys as key>
      <#assign val = hash[key]!"" />
      "${key}": <#if val?has_content><#if val?is_hash><@displayHash hash=val /><#elseif val?is_boolean>"${val?string}"<#else>"${val?string}"</#if><#else>""</#if>
      <#if key_has_next>,</#if>
    </#list>
  }
  </#escape>
</#macro>