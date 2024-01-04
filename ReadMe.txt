Libraries Used => 
1. express -> express is a library used to build a single page, multipage, and hybrid web application. It's a layer built on the top of the Node js that helps manage servers and routes
2. fs -> Used to access file system, module system, and read and write contents into dfferent files
3. path -> used to access relative path of files of current directory
4. googleapis -> to acces google apis in the application
5. node-cron -> to initiate cron jobs in app. Cron jobs are scheduled jobs, which allow us to repeat any action in set interval of time


Improvements => 
The code currently does not return a good UI page when intiating request. We are sending a single line 
response. If there is a Frontend code, it can be integrated with the backend, to develop a full fledged 
web application.
The refresh token is currently not in use. For that, a Database has to be maintained ideally, where we
will store the current access token, and after every 60 min, use refresh token function provided by
google OAuth2 library, to update the access token in database.