## WARNING: This is my hack zone. Beware! And don't rely on it being in a working state!
## NOTE: this repo is a 'viewer' on things in AgilePlace - no AP means no use. You can't update AP from here......yet.....

# Getting Started

You need to install a couple  of packages. If you don't know how to, or can't work it out, then this repo is not for you.

1. npm
2. nodejs

Download the complete repo to a new folder on your system.

In the root directory, run the 'npm install' command in a shell/cmd

The AgilePlace host needs to be identified and stored in the environment variables so that the NextJs system can find it.
As I am using a Windows PC, I put the two required variables into my users setup. This means that if it is me logged in, then I can set it to use my credentials
It is possible to put the variables into the system environment, but then ANY user that logs into the PC will make use of the same credentials - which may be an issue for auditing purposes

I have run this on another machine on the same network as the client, so you can provide this as a server to other people - but once again, it has no user authentication on the client, so all users will look like you when the server accesses AP. I believe that the startup of nodejs can be made to limit to the loopback interface (127.0.0.1), so that it then becomes available to only those logged into the machine

Two variables are needed:
1. "AGILEPLACE_HOST" - The URL of the AgilePlace instance you are using, e.g. "https://nacl.leankit.com"
2. "AGILEPLACE_KEY" - The API token that you generate from AgilePlace to give access. See the AgilePlace docs on how to do that
(If you don't want to use an APIKEY, then provide AGILEPLACE_USER and AGILEPLACE_PWD)

Another variable you can set is AGILEPLACE_CACHE_AGE_LIMIT. This sets the timeout for the cache to a number of minutes. The default is 30min if you do not set it. There is no mechanism to invalidate the cache just yet. The only solution is to kill the app and then restart it. I will fix it, at some point, to keep in sync with AP and any local changes that are made. For the moment, this app works read-only and doesn't update AP....yet....

Once you have everything configured, you can run an npm command to get things going. It can be a little slow if you run as the development environment version. The development environment is useful in that it attempts to notice any code changes you make and auto-reload the client (but, it doesn't always happen in a timely fashion!)

If you just want to run the code, then build it (npm run build) and then start it up (npm start). If you want to run in development mode (e.g. you are going to do code changes) use 'npm run dev'

The start of things to access is at "http://localhost:3000". Notice that it is http not https. We are only going locally, so security is not needed (and you would need to have a certificate configured!). Same goes for any machine on the local network. The 'home' page is extremely rudimentary as I haven't got around to doing that yet. So, you might want to start off on the "http://localhost:3000/nui/context" page. On this page, each tile that gets shown has a number of icons on it. Click on one of them for a tree (or partition map, sunburst or timeline representation) of the cards on that boards AND all their children (regardless of which board that they reside on). This should open another tab. I will add more icons as I add more functionality

The browser accesses the locally running server which fetches data as required by accessing the AgilePlace instance. The local server does not give the browser access to AgilePlace, but you can still do that from your browser in another tab. Some pages will show "Open in New Tab" icons that will redirect you behind the scenes.

I am fond of a "no-clutter" approach, so a lot of things are accessible through clicks and helpful hints come up on 'mouseover'

Clicking on things in the various layouts can get you:
1. Hover over the coloured background of an item (not the text) to get a tooltip that will indicate stuff based on the configuration settings for 'sorting' and colouring'
2. Click to see summary pop-up of the item (flies in from the left - escape, click outside or click on 'x' to close)
3. Shift-Click to focus on that item in ceratin views. Shift-click again on it to go to parent of the item. In sunburst, the centre takes you back to the top items)
4. Alt-Click to open item in new tab (similar to pop-up from #1)
5. Ctrl-Click to minimise that item (adds ** to end of name to indicate children are hidden)

# The Config Menu

Clicking on the gear icon in the top left hand corner will give you a small selection on menu items related to the organisation of the various views. The menu is fairly generic, so there might be some options that don't make sense for the particular view and actually do nothing. It would take far more coding to make this work better.... For example, the 'View' selection only applies to pages that would display the hierarchy of items and not to the 'Configuration' page in the PI Planning App.

## Filter
Some of the views enable a filter panel in the config menu. This filter will give you a list of the top level items (from the board) to select from. THis will then filter the view based on just those items selected

## View
The options are for Tree, Sunburst, Partition, or Timeline. The first three are D3 representations of the hierarchy of cards starting with items from the board you are on. These views will fetch the whole tree of things down 3 levels (default): WHICH CAN TAKE A LONG TIME if you aren't very well organised with your boards. To prevent this, you can add the URL parameter of "?depth=2" (or "&depth=2 if you have other parameters). A depth of -1 will override the safety and fetch EVERYTHING.

## Sorting
By default the sorting is done 'ascending' on the ID. This means newer items come further down the screen. Other possible things to sort on are: Title, Planned Start and End dates, Size of each item, the sum of the sizes of children, and the Score.

## Sort Direction
A bit obvious, but 'ascending' or 'descending'

## Colours
A quick visual to see collections of items based on item data such as: state (Not Started, Started, Finished), Context (Board ID), Card Type, Last Modified By User, or Created By User. 

Or, there are a couple of colour bands: cool, warm. This type of colour can help identify where an item has multiple parents - indicated when there is a child item with a colour different from its parent.

## Error Bars
A splodge of red will show somewhere on an item to indicate it fails some basic tests, e.g. dates aren't set correctly for it, or its parents. Hover over the red bit to get a text message

## Grouping
Some of the views will be able to group by some parameter - this is a work-in-progress currently

## URL Parameters

The URL will accept most of the ones that the Config Menu can set and some others. Any incorrect values are ignored and the default used. Any not present will use the default. 

When you have got a view that you like, the Config Menu has a "Open In New Tab" button that will create a URL from the current options. You can then 'bookmark' that and come back to it later

1. view=tree|sunburst|partition|timeline
2. sort=id|title|size|count|score|plannedStart|plannedFinish|context|r_size
3. dir=ascending|descending
4. colour=cool|warm|state|context|type|l_user|c_user
5. depth=<num>
6. eb=off|on
7. panel=plan|config|allocation
8. dedupe=false|true
9. group=level|context|type

# PI Plan Page

The PI Plan page will only work correctly  if you have some Planning Series and Planning Increments defined on the board you are accessing. It attempts to read the list of Planning Series for the baord and then give you selectors for the series and the increments associated with that series. The intention is that you have a Planning Series called something like "PI Planning" and the timeboxes (increments) within this series are called things like 2023Q1, 2023Q2, 2023Q3, etc. etc.

When you have selected the series and timebox, the page will fetch the items on the board that are associated with the timebox. You can then flip over to either the 'Plan' panel to see the items using a "View", or you can go to the allocation panel. THe allocation panel organises the items into columns based on the sub-increments of the timebox. The intention here is that the sub-increments are your sprint. I would strongly suggest labelling sprints something like 2023Q1Sprint1, 2023Q1S1 or 2023Q1-Jan-04. Using things like "Iteration1" is going to trip you up as there is no indication of 'when' -AND- you might mistakenly label something in 2023 the same as something in 2024 and you wouldn't easily be able to see the difference.

The PI Plan page will attempt to follow the settings in the Config Menu


