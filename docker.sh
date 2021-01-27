#!/bin/sh

start() {
  docker container run --name weppo-postgres \
      -e POSTGRES_PASSWORD=weppo \
      -e POSTGRES_USER=weppo \
      -e POSTGRES_DB=weppo \
      -p 5432:5432 \
      -d postgres
}

fstop() {
  docker container stop weppo-postgres
  docker container rm weppo-postgres
}
init() {
  cat db/weppo.sql | docker container exec -i weppo-postgres psql -U weppo -d weppo -a
}
example() {
  cat db/createexample.sql | docker container exec -i weppo-postgres psql -U weppo -d weppo -a
}

case $1 in
    start)
        start
        ;;
    stop)
        fstop
        ;;
    psql)
        docker container exec -it weppo-postgres psql -U weppo -d weppo
        ;;
    init)
        init
        ;;
    example)
        example
        ;;
    reload)
      fstop
      start
      sleep 10
      init
      example
      ;;
esac
