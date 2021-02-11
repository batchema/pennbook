# PennBook 
## Descriptions
PennBook is an implementation of the core functionalities of facebook.com. It uses 
a Node.js server, React.js for the frontend, and Hadoop libraries such Apache Spark along with AWS Elastic MapReduce for the Big Data functionalities. Below are implementation details. The actual code is in a private repo per university policies. Feel free to reach out for more details.

## Team Members

- [Batchema Sombie](https://www.github.com/batchema) (batchema)

- Divya Somayajula

- Olivia O&#39;Dwyer

- Ishaan Rao

## Screenshots 
Login Page
![login](screenshots/login.png?raw=true "Title")   

Registration Page
![login](screenshots/registration.png?raw=true "Title")   

Homepage
![login](screenshots/homepage.png?raw=true "Title")   

news search Page
![login](screenshots/news_search.png?raw=true "Title")  

profile Page
![login](screenshots/profile.png?raw=true "Title")  

Friend Network Visualizer Page
![login](screenshots/friend_network_visualizer.png?raw=true "Title")  

Chat Page
![login](screenshots/chat.png?raw=true "Title")   

Spark Job Running on AWS EMR (Livy Interface)
![login](screenshots/spark.png?raw=true "Title")

## Features

**Accounts**   
Users have the ability to create accounts, sign in and sign out, have a hashed password for security, and can change any of their interests, affiliation, or password. Users can create posts, friend other users, comment on posts, as well as like posts, articles, and comments.\
**Walls and Home Pages**  
Each user has their own wall that other people can post on and their status updates are displayed on. Each user&#39;s home page shows a feed of their friends&#39; posts and status updates as well as two recommended news articles. The home page also shows a list of new friendships, friends who are online, and any pending friend requests. Users can start a chat session with any online friend from the home page. The wall contains all basic information about the user and a list of their friends.\
**Chat**   
Each user can create chats with other users, including group chats; notifications are sent when a chat is received, and unread chats show up as bolded for distinction. All chats are persistent and real-time if both users are online (using socket.io).\
**Search**  
Users can search for other users by name using the search bar, which queries a table that stores all possible prefixes for each user.\
**News Feeds**   
Each user has a news feed with relevant news articles. Articles are recommended to users based on their interests and which articles they have liked in the past, and all of these show up on the home page. In addition to these, users can search for news articles and will get relevant, sorted results.
The recommendations system is run as a Spark job on Livy every hour and on trigger when a user changes their interests.\
**Extra Credit**  
- Replicating Facebook style likes for posts
- Liking comments and articles
- Pending/Accepting friend requests
- Chat Notifications (per message)

## Source Files

**`client/`**
Comment.js, Home.js, HomeNavBar.js, Messages.js, NewsArticle.js, NewsFeed.js, Post.js, Profile.js, Signup.js, Visualizer.js, newsConstants.js, ports.js, auth.js, AuthRoute.js, Home.css, HomeNavBar.css, Login.css, MainNavBar.css, Messages.css, NewsFeed.css, Profile.css, Signup.css, utils.js, App.js, App.css

**`server/`**
accounts.js, articles\_upload.js, articles-likes.js, articles.js, chats.js, comments-likes.js, friends.js, groups.js, posts\_likes.js, posts.js, recommendations.js, account\_routes.js, chat\_routes.js, comments\_likes\_routes.js, friends\_routes.js, login\_routes.js, news\_feed\_routes.js, recommendations.js, search\_routes.js, visualizer\_routes.js, wall\_home\_routes.js, config.js, jwt.js, app.js

**`spark/`**
Config.java, AdsorptionJob.java, ComputeLivy.java, DataManager.java, DynamoConnector.java, S3Connector.java, SparkConnector.java, MyPair.java

**Third Party Libraries**  
(for Node server and React Frontend. Check spark/pom.xml for java dependencies)

- Bcrypt - used for secure password hashing
- React-graph-vis - used for visualizer
- Ant-design - used for frontend design
- UUIDv4 - used for generating UUIDs for chat ids and visualizer graphs
- Socket.io - used for realtime chat and notifications

## Instructions for Building/Running App

**System Requirements**
1. Node.js version 12.X
2. Java JDK 15
3. Maven 3.6.3
   
- Make sure that all system requirements are met. Follow these links for [Node](https://nodejs.org/en/blog/release/v12.16.1/), [Java JDK](https://docs.oracle.com/en/java/javase/15/install/overview-jdk-installation.html#GUID-8677A77F-231A-40F7-98B9-1FD0B48C346A), and [Maven](https://maven.apache.org/install.html) installations. It is critical that the versions match, especially for the Java JDK and Apache Maven.
- In the `server/` folder, run ` npm ci `
- In the `client/` folder, run ` npm ci `
- In the `client/` folder, run `npm run build`
- In the `client/` folder, run `mv -f build ../server`
- In the spark folder, run ` mvn install `
- Loading the Database:
  - Download the articles json file as `articles.json` and put the file in the `server` folder. Then run shell command `npm run upload-articles` from the `server` folder.
  - Call the `/getloadallkeywords` route in order to populate the articles_keywords table
- App Configurations: 
  - Create `server/.env` and look into `server/.env.dist` for the format of the `.env` file. For example, if running locally, set `SERVER_PORT=8000` and `SERVER_IP=localhost`
  - Navigate to `client/utils/ports.js` and set `API_ENDPOINT` to the correct host and port combination. For example, if running locally, set `var API_ENDPOINT = "localhost:8000"`.
  - Create the folder `.aws` and put the credentials in `.aws/credentials`. Then, in `ComputeLivy.java`, change the String `livyURI` to the corresponding cluster Livy URL. There is a TODO comment next to it. Finally, run `mvn install`, `mvn compile`, and then `mvn package` in the spark folder
- Running the App - there are two options for running the application:
  1. Local: If running locally, open two terminal windows. In one of them navigate to `client/` and run `npm start`. In the other terminal, navigate to `server/` and run `node app.js`. You should see the application at `localhost:3000`.
  2. Deployed on EC2: If running on EC2, navigate to `server/` and run `npm run start-prod`. You should see the application at `<PublicIP>:80`.


## Database schema 
We used DynamoDB. **bold** fields are keys. Partition keys are indicated

- accounts
  - **username - String (partition)**
  - firstname
  - lastname
  - password
  - email
  - affiliation
  - dob
  - interests
  - last\_active

- article\_likes\_by\_username
  - **username - String (partition)**
  - **article\_id - String (sort)**

- article\_likes\_by\_article\_id
  - **article\_id - String (partition)**
  - **username - String (sort)**
- articles\_keyword
  - **keyword - String (partition)**
  - **article\_id - String (sort)**
  - headline
  - url
  - date
  - authors
  - category
  - short\_description
- chat
  - **\_id - String (primary)**
  - **timestamp - Number (sort)**
  - content
  - sender
  - sender\_full\_name

- comment\_likes
  - **comment\_id - String (partition)**
  - **username - String (sort)**
- comments
  - **post\_id - String (partition)**
  - **timestamp - Number (sort)**
  - content
  - commenter\_username
  - number\_of\_likes
  - commenter\_full\_name
- friends
  - **friendA - String (partition)**
  - **friendB - String (sort)**
  - friendA\_full\_name
  - friendB\_full\_name
  - timestamp
  - sender
  - accepted

- news\_articles
  - **article\_id - String (partition)**
  - date
  - authors
  - category
  - short\_description
  - headline
  - link
  - num\_likes

- post\_likes
  - **post\_id - String (partition)**
  - **username - String (sort)**

- posts
  - **post\_id - String**
  - **timestamp - Number**
  - content
  - poster
  - postee
  - num\_likes
  - num\_comments
  - poster\_full\_name
  - postee\_full\_name

- recommendations
  - **username - String (partition)**
  - article\_ids

- search\_cache
  - **query- String (partition)**
  - articles

- user\_chat
  - **username - String (partition)**
  - **\_id - String (sort)**
  - members
  - last\_modified
  - is\_group
  - last\_read

- user\_search
  - **prefix - String (partition)**
  - **username - String (sort)**
  - fullname