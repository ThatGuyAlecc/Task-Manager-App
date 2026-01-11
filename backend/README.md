# Server and API Info

## General

The server is to be run locally. It provides an API with which your frontend implementation can communicate. As the information storage solution, a file-based SQLite database is used. 

While the server has been created with the purpose to make it suitable for the programming assignment, it is quite simple and could be optimized in many ways. You may also have some personal visions about the software product to be created, and they might require some changes to the back end. However, as far as the course assignment is considered, personal modifications to the back end are not allowed. 

The purpose of providing you with this kind of – somewhat limited and perhaps suboptimal – server (and not, e.g., letting you create your own, more customized and optimized one) is to simulate the working life conditions from the perspective of a frontend developer (or a full-stack developer not in charge of the backend development). Quite often in the Real World™ one simply has to try to cope with existing APIs and backend implementations, and possibilities to get them changed for one's needs may be quite limited (or totally nonexistent), so it is good to get used to the fact that not everything is always under your own control.


## Using the server

Unzip the server package (*server.zip*) into some suitable directory on your computer. In that directory, run `npm install`. After that, you should be able to run the server simply with the command `node server.js`. The API server is then listening, by default, requests to Port 3010. You can change the port using the option `-p` or `--port` (e.g., `node server.js -p 3011`), but remember that **your front end should work with a server listening to Port 3010** – that is going to be the port used when testing your work.

The option `-v` or `--verbose` can be used to make the server print more information to the standard output.

When run for the first time, the server creates a file (*db_file.db*) it uses as a database. The server initializes the database with some example data. Your frontend implementation should be able to work with these data and any test data resembling them.

If you remove *db_file.db*, it is recreated when the server is run the next time, and the database will be initialized. Another possibility to restore the database into its initial state is running `node server.js` with the option `-i` or `--initialize`. 

If you prefer starting with an empty database, you can initialize it but prevent populating it with the example data by using the option `-e` or `--empty`.

You can combine one-character options; for example, `node server.js -iv` initializes the database and acts verbosely. 


## API

API offered by the server is simple and should be explained adequately enough by the example commands/queries (using cURL) you can find in the following subsections.

*If you want to test the API endpoints separately and not only from within your frontend code, feel free to use whichever tool you like to send the requests to the API – there are lots of options available. In theory, the `curl` commands presented as examples should work as such in systems having the proper `curl` command available, but, in practice, there may be some variation depending on terminal settings, character encoding issues, etc. Note also that if you try to run `curl` in Windows PowerShell, probably a cmdlet Invoke-WebRequest, which behaves differently from the actual cURL program, is run instead ("curl" being an alias for that). If you want to use `curl` in Windows, it is recommendable to do so in Git Bash – there the proper cURL program is used and everything should work. (Also, e.g., Windows Subsystem for Linux (WSL) could be used for an easy access to proper cURL program in a Windows environment.)*

### GET method can be used to acquire various data from the back end:

* You can get the entire collections of tags, tasks, and timestamps as JSON by simple GET requests to the corresponding endpoints:
  * curl http://127.0.0.1:3010/tags
  * curl http://127.0.0.1:3010/tasks
  * curl http://127.0.0.1:3010/timestamps

* Info on a specific tag, task, or timestamp can be queried by its id:
  * curl http://127.0.0.1:3010/tags/6
  * curl http://127.0.0.1:3010/tasks/3
  * curl http://127.0.0.1:3010/timestamps/158

* Timestamps for a given task can also be got based on the ID of the task: 
  * curl http://127.0.0.1:3010/timesfortask/1

* One can also request only type-0 timestamps (activation times) or type-1 timestamps (deactivation times) by adding either "/0" or "/1" respectively at the end:
  * curl http://127.0.0.1:3010/timesfortask/747/0

* the current theme, information whether we are in the alternative mode (see assignment instructions, Module P), and possibly some own textual option data can be got like this:
  * curl http://127.0.0.1:3010/options/1  
    *(The idea is to use only one options instance with ID 1 and update its values as needed, but in order to maintain the standard semantics and usage of the HTTP methods, creating more options (with PUT) has not been limited. Shouldn't probably be any reason to do so, though.)*


### POST requests can be used to add new content:

* Add a new tag:  
curl -v -X POST http://127.0.0.1:3010/tags -H 'Content-Type: application/json' -d '{"name": "embarrasing", "additional_data": ""}'  
*(Usage of the property "additional_data" has not been fixed, but it can be used to store a string value, if there is some need to store additional data related to the tag. One could, e.g., want to store color information for the UI representation.)*

* Add a new task:  
curl -v -X POST http://127.0.0.1:3010/tasks -H 'Content-Type: application/json' -d '{"name": "procrastinate", "tags": "1,2,3,5", "additional_data": "O_o"}'  
*(The value of the "tags" property is a string having the id values of the tags joined together having a comma as a separator character. Usage of the property "additional_data" has not been fixed, but it can be used to store a string value, if there is some need to store additional data related to the task. One could, e.g., store order information for the UI representation.)*

* Add a new timestamp:  
curl -v -X POST http://127.0.0.1:3010/timestamps -H 'Content-Type: application/json' -d '{"timestamp": "2024-09-28 14:58:09.000", "task": 2, "type": 0}'  
*(Interpretation of the type property: **0 denotes starting and 1 ending a period of activity**. The task value is the id of the related task.)* 


### The DELETE method can be used to remove the desired tag, task, or timestamp:

* curl -v -X DELETE http://127.0.0.1:3010/tags/1
* curl -v -X DELETE http://127.0.0.1:3010/tasks/3
* curl -v -X DELETE http://127.0.0.1:3010/timestamps/7

N.B. If you, e.g., delete a tag from the database, it is your responsibility to make sure that the id of that tag – possibly still left on tag lists of some tasks – does not cause problems. (There is no automatic removal of such occurrences on lists or anything like that happening on the server side.)


### The HTTP methods PUT and PATCH can be used to modify the desired tag, task, timestamp, or option:

* curl -v -X PUT http://127.0.0.1:3010/tags/7 -H 'Content-Type: application/json' -d '{"name": "annoying", "additional_data": "cannot stand this anymore"}'
* curl -v -X PUT http://127.0.0.1:3010/tasks/1 -H 'Content-Type: application/json' -d '{"name": "Feed the SUPERCATS", "tags": "4,7", "additional_data": "mew"}'
* curl -v -X PUT http://127.0.0.1:3010/timestamps/9 -H 'Content-Type: application/json' -d '{"timestamp": "1981-04-30 00:00:00.000", "task": 1, "type": 1}'
* curl -v -X PUT http://127.0.0.1:3010/options/1 -H 'Content-Type: application/json' -d '{"theme": "Zebra", "alternative": 1, "own_textual_data": "Once upon a time there was a duck."}'  
*(Remember: you should be able to cope with only this one options item with ID 1.)*
* curl -v -X PATCH http://127.0.0.1:3010/tags/5 -H 'Content-Type: application/json' -d '{"name": "something"}'
* curl -v -X PATCH http://127.0.0.1:3010/tasks/1 -H 'Content-Type: application/json' -d '{"tags": "1,4,9", "additional_data": "My kewl string of additional data"}'
* curl -v -X PATCH http://127.0.0.1:3010/timestamps/9 -H 'Content-Type: application/json' -d '{"task": 2, "type": 0}'
* curl -v -X PATCH http://127.0.0.1:3010/options/1 -H 'Content-Type: application/json' -d '{"alternative": 0}'
