1. Testing All APIs in Postman
We’ll make a Postman collection that covers:

Auth

POST /auth/signup

POST /auth/login

Folder

POST /folders/create

PUT /folders/rename/:id

PUT /folders/trash/:id

DELETE /folders/delete/:id

File

POST /files/upload

PUT /files/rename/:id

PUT /files/trash/:id

DELETE /files/delete/:id

Search

GET /search?query=example

Sharing

POST /folder/share

POST /file/share

💡 In Postman:

Add Authorization → Bearer token for protected routes.

Use Environment Variables for {{BASE_URL}} and {{TOKEN}}.