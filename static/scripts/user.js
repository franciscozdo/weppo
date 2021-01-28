/* INIT */

function insertMe() {
  function success(user) {
    insert('name', user.name);
    insert('address', user.address);
    insert('email', user.email);
  }
  getMe(success, console.log);
}

function insertUser(user_id) {
  function success(user) {
    insert('name', user.name);
    insert('address', user.address);
    insert('email', user.email);
  }
  getUser(user_id, success, console.log);
}

function createUserListNode(user) {
  let li = document.createElement("li");
  let id = document.createElement("a");
  id.innerText = user.id;
  id.setAttribute("href", `/user/${user.id}`);
  let name = document.createElement("span");
  name.innerText = ` [${user.name}]`;
  let email = document.createElement("span");
  email.innerText = ` [${user.email}]`;
  li.appendChild(id);
  li.appendChild(name);
  li.appendChild(email);
  return li;
}

function insertUserList() {
  function success(users) {
    for (user of users) {
      append("userList", createUserListNode(user));
    }
  }
  getUserList(success, console.log);
}

/* ACTIONS */

function buttonAddRole(user_id) {
  /* TODO */
}

function buttonDelRole(user_id) {
  /* TODO */
}
