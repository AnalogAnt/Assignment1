const { addDays, format, isValid } = require("date-fns");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jst = require("jsonwebtoken");
const path = require("path");
const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const startServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is Running");
    });
  } catch (e) {
    console.log(e);
  }
};

startServer();

const convertDbObjectToResponseObjectMatch = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const authenticateRequest = (request, response, next) => {
  const { status, priority, search_q, category, dueDate } = request.query;
  let nduedate = new Date(dueDate);
  if (!(status === "TO DO" || "IN PROGRESS" || "DONE")) {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (!(priority === "HIGH" || "MEDIUM" || "LOW")) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (!(category === "WORK" || "HOME" || "LEARNING")) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (!(dueDate === undefined)) {
    console.log("yo");
    if (!isValid(nduedate)) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  next();
};

app.get("/todos/", authenticateRequest, async (request, response) => {
  const { status, priority, search_q, dueDate, category } = request.query;
  let getTodoQuery = ``;
  if (typeof status != typeof undefined) {
    getTodoQuery = `SELECT * FROM todo WHERE status LIKE '%${status}%';`;
  } else if (
    typeof status != typeof undefined &&
    typeof priority != typeof undefined
  ) {
    getTodoQuery = `SELECT * FROM todo WHERE status LIKE '%${status}%'AND priority LIKE '%${priority}%';`;
  } else if (typeof priority != typeof undefined) {
    getTodoQuery = `SELECT * FROM todo WHERE priority LIKE '%${priority}%'`;
  } else if (search_q != undefined) {
    getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
  } else if (category != undefined && status != undefined) {
    getTodoQuery = `SELECT * FROM todo WHERE category LIKE '%${category}%' AND status LIKE '%${status}%';`;
  } else if (category != undefined) {
    getTodoQuery = `SELECT * FROM todo WHERE category LIKE '%${category}%';`;
  } else if (category != undefined && priority != undefined) {
    getTodoQuery = `SELECT * FROM todo WHERE category LIKE '%${category}% AND priority LIKE '%${priority}%';`;
  }
  const todoList = await db.all(getTodoQuery);
  response.send(
    todoList.map((eachPlayer) =>
      convertDbObjectToResponseObjectMatch(eachPlayer)
    )
  );
});

app.get("/todos/:todoId/", authenticateRequest, async (request, response) => {
  const { todoId } = request.params;
  const getPriorityQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const priorityList = await db.all(getPriorityQuery);
  response.send(convertDbObjectToResponseObjectMatch(priorityList[0]));
});

app.post("/todos/", authenticateRequest, async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, dueDate, category } = todoDetails;
  const postQuery = `INSERT INTO todo(id,todo,priority,status,due_date,category) VALUES( ${id},'${todo}','${priority}','${status}','${dueDate}','${category}');`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", authenticateRequest, async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (typeof status != typeof undefined) {
    const putQuery = `UPDATE todo SET status='${status}' WHERE id =${todoId};`;
    await db.run(putQuery);
    response.send("Status Updated");
  } else if (typeof priority != typeof undefined) {
    const putQuery = `UPDATE todo SET priority = '${priority}' WHERE id =${todoId};`;
    await db.run(putQuery);
    response.send("Priority Updated");
  } else if (typeof todo != typeof undefined) {
    const putQuery = `UPDATE todo SET todo ='${todo}' WHERE id =${todoId};`;
    await db.run(putQuery);
    response.send("Todo Updated");
  } else if (category != undefined) {
    const putQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
    await db.run(putQuery);
    response.send("Category Updated");
  } else if (dueDate != undefined) {
    let ndueDate = new Date(dueDate);
    const formattedDate = format(
      new Date(ndueDate.getFullYear(), ndueDate.getMonth(), ndueDate.getDate()),
      "yyyy-MM-dd"
    );
    const putQuery = `UPDATE todo SET due_date = '${formattedDate}' WHERE id = ${todoId};`;
    await db.run(putQuery);
    response.send("Due Date Updated");
  }
});

app.delete(
  "/todos/:todoId/",
  authenticateRequest,
  async (request, response) => {
    const { todoId } = request.params;
    const delQuery = `DELETE FROM todo WHERE id = ${todoId};`;
    await db.run(delQuery);
    response.send("Todo Deleted");
  }
);

app.get("/agenda/", authenticateRequest, async (request, response) => {
  let dateDetails = request.query;
  console.log(dateDetails);
});

module.exports = app;
