<html>
   <head>
      <style type="text/css"><!--
      body {
        font-family: Arial, sans-serif;
        font-size: 14px;
        color: #4c4c4c;
      }

      a, a:visited {
        color: #0072cf;
      }
      --></style>
   </head>

   <body bgcolor="#dddddd">
      <table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#dddddd">
         <tr>
            <td width="100%" align="center">
               <table width="70%" cellpadding="0" cellspacing="0" bgcolor="white" style="background-color: white; border: 1px solid #aaaaaa;">
                  <tr>
                     <td width="100%">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                           <tr>
                              <td style="padding: 10px 30px 0px;">
                                 <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                       <td>
                                          <table cellpadding="0" cellspacing="0" border="0">
                                             <tr>
                                                <td>
                                                   <img src="${shareUrl}/res/components/dashlets/event-scheduling/images/event-scheduling-64.png" alt="" width="64" height="64" border="0" style="padding-right: 20px;" />
                                                </td>
                                                <td>
                                                   <div style="font-size: 22px; padding-bottom: 4px;">
                                                      ${document.properties["cm:title"]!""}
                                                   </div>
                                                   <div style="font-size: 13px;">
                                                      Créé le : ${document.properties["cm:created"]?date?string.full?capitalize}
                                                   </div>
                                                </td>
                                             </tr>
                                          </table>
                                          <div style="font-size: 14px; margin: 12px 0px 24px 0px; padding-top: 10px; border-top: 1px solid #aaaaaa;">
                                             <#assign siteId = document.getSiteShortName()!"" />
                                             <p>Bonjour ${recipientFirstName!""},</p>

                                             <#assign creator = document.properties["cm:creator"] />
                                             <p>N'oubliez pas de donner vos disponibilités concernant l'événement "${document.properties["cm:title"]!""}" créé par <a href="${shareUrl}/page/user/${creator}/profile">${eventSchedulingUtils.getPersonFullName(creator)?trim}</a><#if document.properties["evtsched:place"]?? && document.properties["evtsched:place"]?has_content> qui aura lieu à "${document.properties["evtsched:place"]!""}"</#if>.</p>
                                             <#if document.properties["cm:description"]??>
                                             <p>${document.properties["cm:description"]!""}<p>
                                             </#if>

                                             Donnez dès maintenant vos disponibilités directement depuis <a href="${shareUrl}/page/answer-event?nodeRef=${document.nodeRef}">cette page</a> ou depuis <a href="${shareUrl}/page/user/${recipient}/dashboard">votre tableau de bord</a>&nbsp;*<#if siteId?has_content> ou depuis le <a href="${shareUrl}/page/site/${siteId}/dashboard">tableau de bord du site</a></#if>.

                                             <p>Les dates proposées sont :</p>
                                             <#assign dates = document.childAssocs["evtsched:dates"]!"" />
                                             <#if dates?? && dates?has_content>
                                                <ul>
                                                <#list dates?sort_by(['properties', 'evtsched:date']) as dateNode>
                                                  <#assign date = dateNode.properties["evtsched:date"] />
                                                  <#assign scheduleNodes = dateNode.childAssocs["evtsched:times"]!"" />
                                                  <#if scheduleNodes?? && scheduleNodes?has_content>
                                                    <#list scheduleNodes as timeNode>
                                                      <li>${date?date?string.full?capitalize}, ${timeNode.properties["cm:title"]!timeNode.name}</li>
                                                    </#list>
                                                  <#else>
                                                    <li>${date?date?string.full?capitalize}</li>
                                                  </#if>
                                                </#list>
                                                </ul>
                                             </#if>

                                             <#if document.properties["cm:to"]??>
                                             <p>Attention, vous avez jusqu'au ${document.properties["cm:to"]?date?string.full?capitalize} pour répondre.</p>
                                             </#if>

                                             <br>
                                             <p>Cordialement.</p>
                                          </div>
                                       </td>
                                    </tr>
                                 </table>
                              </td>
                           </tr>
                           <tr>
                              <td>
                                 <div style="border-top: 1px solid #aaaaaa;">&nbsp;</div>
                              </td>
                           </tr>
                           <tr>
                              <td>
                                 <div style="padding: 10px 30px; font-size: 10px; font-style:italic;">
                                   *&nbsp;Pour pouvoir participer, vous devez ajouter la dashlet "Planification d'événements" sur votre <a href="${shareUrl}/page/customise-user-dashboard">tableau de bord</a>.
                                 </div>
                              </td>
                           </tr>
                           <tr>
                              <td>
                                 <div style="border-bottom: 1px solid #aaaaaa;">&nbsp;</div>
                              </td>
                           </tr>
                           <tr>
                              <td style="padding: 10px 30px;">
                                 <img src="${shareUrl}/themes/default/images/app-logo.png" alt="" width="117" height="48" border="0" />
                              </td>
                           </tr>
                        </table>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
   </body>
</html>