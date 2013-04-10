var MAPPING_TYPE =
{
   API: 0,
   STATIC: 1
};

var weightings = {
  "SiteConsumer": 1,
  "SiteContributor": 2,
  "SiteCollaborator": 3,
  "SiteManager": 4,
  "AllSiteMembers": 5,
  "EVERYONE": 6
};

var mapUser = function(data)
{
   if (args.ignoreGuest && data.userName == 'guest') {
      return null;
   }

   return (
   {
      authorityType: "USER",
      shortName: data.userName,
      fullName: data.userName,
      displayName: (data.firstName ? data.firstName + " " : "") + (data.lastName ? data.lastName : ""),
      description: data.jobtitle ? data.jobtitle : "",
      sortField: '0-00-' + data.userName,
      metadata:
      {
         avatar: data.avatar || null,
         jobTitle: data.jobtitle || "",
         organization: data.organization || ""
      }
   });
};

var mapGroup = function(data)
{
   var displayName = data.displayName
       fullName = data.fullName,
       weighting = data.weighting || 0;
   if (args.site && args.zone && args.zone == "APP.SHARE") {
      if (fullName.indexOf("GROUP_site_" + args.site + "_") == 0) {
        var role = fullName.substr("GROUP_site_".length + args.site.length + 1);
        displayName = msg.get("label.group." + role) + " (" + args.site + ")";
        weighting = weightings[role];
      }
   }

   return (
   {
      authorityType: "GROUP",
      shortName: data.shortName,
      fullName: fullName,
      displayName: displayName,
      description: fullName,
      sortField: weighting + '-01-' + data.shortName,
      metadata:
      {
      }
   });
};

var getMappings = function()
{
   var mappings = [],
      authorityType = args.authorityType === null ? "all" : String(args.authorityType).toLowerCase();

   if (authorityType === "all" || authorityType == "user")
   {
      var url = "/api/people?filter=" + encodeURIComponent(args.filter);
      if (args.site && args.zone && args.zone == "APP.SHARE") {
        url = "/atolcd/api/sites/" + args.site + "/memberships?authorityType=USER&nf=" + encodeURIComponent(args.filter);
      }

      mappings.push(
      {
         type: MAPPING_TYPE.API,
         url: url,
         rootObject: "people",
         fn: mapUser
      });
   }

   if (authorityType === "all" || authorityType === "group")
   {
      var filter = args.filter;
      if (args.site && args.zone && args.zone == "APP.SHARE") {
        filter = "site_" + args.site + "_";
      }

      var url = "/api/groups?shortNameFilter=" + encodeURIComponent(filter);
      if (args.zone !== "all")
      {
         url += "&zone=" + encodeURIComponent(args.zone === null ? "APP.DEFAULT" : args.zone);
      }

      mappings.push(
      {
         type: MAPPING_TYPE.API,
         url: url,
         rootObject: "data",
         fn: mapGroup
      });

      // Find groups in the site
      if (args.site && args.zone && args.zone == "APP.SHARE") {
        mappings.push(
        {
           type: MAPPING_TYPE.API,
           url: "/atolcd/api/sites/" + args.site + "/memberships?authorityType=GROUP&nf=" + encodeURIComponent(args.filter),
           rootObject: "groups",
           fn: mapGroup
        });
      }

      if (args.everyone) {
        mappings.push(
        {
           type: MAPPING_TYPE.STATIC,
           data: [
              {
                 shortName: "EVERYONE",
                 fullName: "GROUP_EVERYONE",
                 displayName: msg.get("group.everyone"),
                 description: "GROUP_EVERYONE",
                 weighting: weightings["EVERYONE"]
              }
           ],
           fn: mapGroup
        });
      }
      if (args.site && args.zone && args.zone == "APP.SHARE") {
        mappings.push(
        {
           type: MAPPING_TYPE.STATIC,
           data: [
              {
                 shortName: "site_" + args.site,
                 fullName: "GROUP_site_" + args.site,
                 displayName: msg.get("label.group.AllSiteMembers") + " (" + args.site + ")",
                 description: "GROUP_site_" + args.site,
                 weighting: weightings["AllSiteMembers"]
              }
           ],
           fn: mapGroup
        });
      }
   }
   return mappings;
};

function main()
{
   var mappings = getMappings(),
      connector = remote.connect("alfresco"),
      authorities = [],
      mapping, result, data, i, ii, j, jj;

   for (i = 0, ii = mappings.length; i < ii; i++)
   {
      mapping = mappings[i];
      if (mapping.type == MAPPING_TYPE.API)
      {
         result = connector.get(mapping.url);
         if (result.status == 200)
         {
            data = eval('(' + result + ')');
            for (j = 0, jj = data[mapping.rootObject].length; j < jj; j++)
            {
               var auth = mapping.fn.call(this, data[mapping.rootObject][j]);
               if (auth) {
                authorities.push(auth);
               }
            }
         }
      }
      else if (mapping.type == MAPPING_TYPE.STATIC)
      {
         for (j = 0, jj = mapping.data.length; j < jj; j++)
         {
            authorities.push(mapping.fn.call(this, mapping.data[j]));
         }
      }
   }

   return authorities;
}

model.authorities = main();