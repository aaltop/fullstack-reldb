# Contents

Contains code for part 13 of the [Full stack open](https://fullstackopen.com/en/) course.
Other parts can be found at and through https://github.com/aaltop/fullstackopen.
This part of the course deals with using a relational (SQL) database, specifically
PostgreSQL (or Postgres), for managing backend data. However, most
of the interaction with the database happens through sequelize; see below.

A non-exhaustive list of covered concepts:
- sequelize
    - models (define schemas)
        - static methods like .findOne
        - instance methods like .save
    - relationships
        - for making joins
    - [fn](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#static-method-fn)
        - use actual SQL functions
    - [Op](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/#operators)
        - operators for where
    - migrations
        - migrate the database from one version of schemas to another
    - "through" on attributes connected by connection table
    - "as" to create alias
    - using scopes to define frequently made queries and re-use the
    definitions
        

## Main technologies introduced

[PostgreSQL](https://www.postgresql.org/)

An open source, object-relational (SQL) database. "object-relational"
here refers to some of the object-oriented design choices of Postgres,
such as more complex data types like [arrays](https://www.postgresql.org/docs/current/arrays.html#ARRAYS)
and [the ability to define functions](https://www.postgresql.org/docs/current/xfunc.html#XFUNC).

[sequelize](https://sequelize.org/docs/v6/)

An object-relational mapping tool that supports a variety of SQL
backends, including Postgres. As opposed to the Postgres object-relational
quality, object-relational here means that in the Javascript code,
data can be handled as usual objects while still obviously existing
in a relational manner in the (Postgres) database.
