[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-7f7980b617ed060a017424585567c406b6ee15c891e84e1186181d67ecf80aa0.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=11233116)

## Running Docker
Perform the following commands to setup the docker container for the MongoDB server.

1. Create container

`docker run -d --name final-mongo-server -p "27017:27017" -e "MONGO_INITDB_ROOT_USERNAME=root" -e "MONGO_INITDB_ROOT_PASSWORD=hunter2" mongo`

2. Start bash shell in MongoDB container (may need to run this in powershell if problematic in bash)

`docker exec -it final-mongo-server /bin/bash`

You should now see a terminal prompt like this: `root@1d738c5f127f:/#`

3. Launch mongo shell

`mongosh --username root --password hunter2 --authenticationDatabase admin`

You should now see a terminal prompt like this: `test> `

4. Create `tarpaulin` database. This is what you'll "log in" to with your environment variables

`use tarpaulin`

5. Create `tarpaulin` user. This is the user profile you will use to log in to the `tarpaulin` database with your environment variables

`db.createUser({user: "tarpaulin", pwd: "hunter2", roles: [{role: "readWrite", db: "tarpaulin"}] });`

Exit the mongo shell (enter `exit` in the cmd prompt until returned to original shell or open a new shell). 

6. Create environment variables to log in to MongoDB database (bash example below)

`export MONGO_USER=tarpaulin`

`export MONGO_DB_NAME=tarpaulin`

`export MONGO_AUTH_DB_NAME=tarpaulin`

`export MONGO_PASSWORD=hunter2`

7. Run the server with nodemon

`npm run dev`
