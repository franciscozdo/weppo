function addBefore(name, node) {
  let elem = document.getElementById(name);
  elem.parentNode.insertBefore(node, elem);
}

function clearForm(form) {
  for (e of form.elements) {
    e.value = "";
  }
}

function addItem() {
  let form = document.getElementById("itemAdd");
  let item = {};
  for (e of form.elements) {
    switch(e.name) {
      case "name":
        if (e.value != "")
          item.name = e.value;
        break;
      case "price":
        if (e.value != "")
          item.price = e.value;
        break;
      case "amount":
        if (e.value != "")
          item.amount = e.value;
        break;
      case "available":
        item.available = e.checked;
    }
  }
  item.hidden = false;
  function success(rsp) {
    rsp = JSON.parse(rsp);
    let div = document.createElement("div");
    div.innerText = "Succes! ";
    div.setAttribute("style", "color: green");
    let a = document.createElement("a");
    a.innerText = "See new item";
    a.setAttribute("href", `/item/${rsp.id}`);
    div.appendChild(a);
    addBefore("console", div);
    clearForm(form);
  }
  function fail(rsp) {
    let div = document.createElement("div");
    div.innerText = `Failure! (${rsp})`;
    div.setAttribute("style", "color: red");
    addBefore("console", div);
  }
  putNewItem(item, success, fail);
}

function buttonUpdateItem(id) {
  function getValues(item) {
    form = document.getElementById("itemUpdate");
    for (e of form.elements) {
      switch(e.name) {
        case "name":
          if (e.value != "")
            item.name = e.value;
          break;
        case "price":
          if (e.value != "")
            item.price = e.value;
          break;
        case "amount":
          if (e.value != "")
            item.amount = e.value;
          break;
        case "available":
          item.available = e.checked;
          break
        case "visible":
          item.hidden = !e.checked;
      }
    }
  updateItem(item, (x) => { clearForm(form); insertItemUpdate(id) }, console.log);
  }
  getItemById(id, getValues, console.log);
}
