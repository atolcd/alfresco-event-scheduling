<#assign userNames = memberInfo?keys />
<#assign first = true />
{
  <#if args.authorityType?? && args.authorityType == "GROUP">"groups":<#else>"people":</#if>
  [
    <#list userNames as userName>
      <#if first == false>,<#else><#assign first = false /></#if>
      <@membershipJSON site=site authority=authorities[userName] authorityType=args.authorityType />
    </#list>
  ]
}


<#macro membershipJSON site authority authorityType>
  <#escape x as jsonUtils.encodeJSONString(x)>
    <#if authority.authorityType?? && authority.authorityType = "GROUP" && authorityType = "GROUP">
      {
        "authorityType": "${authority.authorityType}",
        "shortName": "${authority.shortName}",
        "fullName": "${authority.fullName!""}",
        "displayName": "${authority.displayName}",
        "url": "${url.serviceContext + "/api/groups/" + authority.shortName}"
      }
    <#else>
      {
        "authorityType": "USER",
        "fullName": "${authority.properties.userName}",
        "userName": "${authority.properties.userName}",
        "firstName": "${authority.properties.firstName!""}",
        "lastName": "${authority.properties.lastName!""}",
        <#if authority.assocs["cm:avatar"]??>
          "avatar": "${"api/node/" + authority.assocs["cm:avatar"][0].nodeRef?string?replace('://','/') + "/content/thumbnails/avatar"}",
        </#if>
        <#if authority.properties.jobtitle??>
          "jobtitle": "${authority.properties.jobtitle}",
        </#if>
        <#if authority.properties.organization??>
          "organization": "${authority.properties.organization}",
        </#if>
        <#if authority.properties.userStatus??>
          "userStatus": "${authority.properties.userStatus}",
          "userStatusTime": { "iso8601": "${xmldate(authority.properties.userStatusTime)}"},
        </#if>
        "url": "${url.serviceContext + "/api/people/" + authority.properties.userName}"
      }
    </#if>
  </#escape>
</#macro>