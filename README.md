# My AI Gallery

> AI driven image media gallery written with Go and Svelte.

## Before you start

First provide following environment variables:

- `MAIG_IMAGES`: root folder of your media files

Then create the following `.env.local` files:

- [.env.local](./.env.local)
- [backend/.env.local](./backend/.env.local)
- [frontend/.env.local](./frontend/.env.local)

## Run

```bash
# if required: full re-build
# docker-compose build --no-cache

# start
docker-compose up --build
```
