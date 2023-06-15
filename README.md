## Getting Started

Download the complete repo to a new folder on your system.

In the root directory, run the 'npm install' command in a shell/cmd

The AgilePlace host needs to be identified and stored in the environment variables so that the NextJs system can find it.
As I am using a Windows PC, I put the two required variables into my users setup. This means that if it is me logged in, then I can set it to use my credentials
It is possible to put the variables into the system environment, but then ANY user that logs into the PC will make use of the same credentials - which may be an issue for auditing purposes

Two variables are needed:
1. "AGILEPLACE_HOST" - The URL of the AgilePlace instance you are using, e.g. "https://nacl.leankit.com"
2. "AGILEPLACE_KEY" - The API token that you generate from AgilePlace to give access. See the AgilePlace docs on how to do that
(If you don't want to use an APIKEY, then provide AGILEPLACE_USER and AGILEPLACE_PWD)

Another variable you can set is AGILEPLACE_CACHE_AGE_LIMIT. This sets the timeout for the LRU cache to a number of minutes. The defaults to 30min if you do not set it. As it is an LRU cache, this means the more you use an item to display it, the more likely it is to get out of sync with the AP host if you set it too high. There is no mechanism to invalidate the cache just yet. The only solution is to kill the app and then restart it.

Once you have everything configured, you can run the 'npm run dev' command to get things going. It can be a little slow because this is the development environment version and will want to compile everything the first time out.

Open a browser window to access "http://localhost:3000". Notice that it is http not https. We are only going locally, so security is not needed (and you would need to have a certificate configured!)

The browser accesses the locally running server which fetches data as required by accessing the AgilePlace instance. The local server does not give the browser access to AgilePlace, but you can still do that from your browser in another tab.

The 'home' page is rudimentary as I haven't got around to doing that yet.

Each tile that gets shown has three icons on it. Click on one of them for a tree, partition map, or sunburst representation of the cards on that boards AND all their children (regardless of which board that they reside on). This should open another tab.

On that tab, the board title is shown as an uneditable textfield and there is a settings menu available through clicking on the gear on the left.

In the settings, you can change the conditions for the layout and, if you so wish, click on the "Open In New Tab" link to get a tab with those settings encoded into the URL. This is handy for saving in your 'favourites' or 'bookmarks'

Clicking on things in the various layouts can get you:
1. Click to see summary pop-up of the item (flies in from the left - escape, click outside or click on 'x' to close)
2. Shift-Click to focus on that item (shift-click again on it to go to parent of item. In sunburst, the centre takes you back to the top items)
3. Alt-Click to open item in new tab (similar to pop-up from #1)
4. Ctrl-Click to minimise that item (adds ** to end of name to indicate)

