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
<#include "/org/alfresco/components/component.head.inc">

<@link rel="stylesheet" type="text/css" href="${page.url.context}/res/components/dashlets/event-scheduling/css/event-scheduling.css" />
<@link rel="stylesheet" type="text/css" href="${page.url.context}/res/components/dashlets/event-scheduling/css/answer-event.css" />
<@link rel="stylesheet" type="text/css" href="${page.url.context}/res/components/dashlets/event-scheduling/css/create-or-edit-event.css" />
<!--[if IE]>
<link rel="stylesheet" type="text/css" href="${page.url.context}/res/components/dashlets/event-scheduling/css/event-scheduling-ie.css" />
<![endif]-->


<!-- Authority Finder Assets -->
<@link rel="stylesheet" type="text/css" href="${page.url.context}/res/components/people-finder/authority-finder.css" />
<@script type="text/javascript" src="${page.url.context}/res/components/people-finder/authority-finder.js"></@script>

<!-- Simple Dialog -->
<@script type="text/javascript" src="${page.url.context}/res/modules/simple-dialog.js"></@script>

<!-- Calendar Utils -->
<@script type="text/javascript" src="${page.url.context}/res/components/calendar/calendar-view.js"></@script>

<!-- Generic action -->
<@script type="text/javascript" src="${url.context}/res/modules/documentlibrary/doclib-actions.js"></@script>


<!-- Event Scheduling-->
<@script type="text/javascript" src="${page.url.context}/res/components/dashlets/event-scheduling/answer-event.js"></@script>
<@script type="text/javascript" src="${page.url.context}/res/components/dashlets/event-scheduling/create-or-edit-event.js"></@script>
<@script type="text/javascript" src="${page.url.context}/res/components/dashlets/event-scheduling/event-scheduling-dashlet.js"></@script>