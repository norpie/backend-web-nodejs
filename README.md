[GitHub](https://github.com/norpie/backend-web-nodejs)

# Setup

You need to provide a .env file, eg.

```.env
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=backend
API_SECRET=94d9f2dee4bb80fea10399a0e10a9a3df874d86b9454da2d6f5a4bb57314329d
```

## Explanation

DB_* refers to a variable needed for the postgresql connection, API_SECRET is used in signing the jwt tokens.
