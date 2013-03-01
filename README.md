"Event scheduling"  Share dashlet
================================

This extension allows you to plan events (http://www.doodle.com like) directly from a Share dashlet (the dashlet can be added, either on a user or on a site dashboard).  
Works with: Alfresco **Community** & **Enterprise** 4.x.x


Building the module
-------------------
Check out the project if you have not already done so 

        git clone git://github.com/atolcd/alfresco-event-scheduling.git

An Ant build script is provided to build AMP files containing the custom files.  
Before building, ensure you have edited the `build.properties` file to set the path to your Alfresco SDK.  

To build AMP files, run the following command from the base project directory:

        ant dist-amp


Installing the module
---------------------
This extension is a standard Alfresco Module, so experienced users can skip these steps and proceed as usual.

1. Stop Alfresco
2. Use the Alfresco [Module Management Tool](http://wiki.alfresco.com/wiki/Module_Management_Tool) to install the modules in your Alfresco and Share WAR files:

        java -jar alfresco-mmt.jar install event-scheduling-alfresco-vX.X.X.amp $TOMCAT_HOME/webapps/alfresco.war -force
        java -jar alfresco-mmt.jar install event-scheduling-share-vX.X.X.amp $TOMCAT_HOME/webapps/share.war -force

3. Delete the `$TOMCAT_HOME/webapps/alfresco/` and `$TOMCAT_HOME/webapps/share/` folders.  
**Caution:** please ensure you do not have unsaved custom files in the webapp folders before deleting.
4. Start Alfresco


Using the module
---------------------
Add the dashlet on your (site/user) dashboard.

#### Who can plan events?
 - In a site, only managers can schedule events
 - From the user dashlet, only administrators and members of the "Event Planners" group (GROUP_EVENT_SCHEDULED_CREATORS) can plan an event.

*The "Event Planners" group is created during the bootstrap of the module, by default, it does not contains any user. You are free to decide who will be able to create events.*

#### Events
Events can be: 
 - **private** : restricted to a limited number of users (groups/users picker)
 - **public** : all users can view these events and give their availabilities

Each participant can give its availabilities from the **dashlet** or from a **standalone page**.  

###### Mail notifications
Notifications can be sent:
 - Ability to notify participants when an **event has been created** (private events only)
 - Ability to send a **reminder** to a specific participant or to all the participants (action only accessible by the creator of the event)

###### Indicators
A list of indicators are displayed next to each event in the dashlet:
 - a flag that indicates if the user **has given his availabilities** (yes / no / partially)
 - an indicator that specifies if the event was **created from a site**
 - an **expiration** indicator (if a validity date has been set)
 - a flag that indicates if it's or not an **archived event**

###### Actions
A participant can:
 - **view event details**
 - **give its availabilities**
 - **check availabilities** of others participants

The creator of an event can:
 - **edit the event** (edit metadata and/or add dates or groups/users)
 - **send reminders** to a specific participant or to all the participants
 - **delete** event
 - **archive**/restore event
 - see event **history**



LICENSE
---------------------
This extension is licensed under `GNU Library or "Lesser" General Public License (LGPL)`.  
Created by: [Bertrand FOREST] (https://github.com/bforest)  
Dashlet created for the [2012 Alfresco Dashlet Challenge](https://wiki.alfresco.com/wiki/Dashlet_Challenge#2012).  


Our company
---------------------
[Atol Conseils et Développements] (http://www.atolcd.com) is Alfresco [Gold Partner] (http://www.alfresco.com/partners/atol)  
Follow us on twitter [ @atolcd] (https://twitter.com/atolcd)  